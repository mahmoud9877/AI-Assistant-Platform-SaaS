"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Paperclip,
  Send,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface Message {
  id: string;
  sender: "user" | "eve";
  content: string;
  timestamp: Date;
  type?: "text" | "file";
  fileUrl?: string;
  fileName?: string;
}

interface EveData {
  id?: string;
  name: string;
  department: string;
  introduction: string;
  photoUrl?: string;
  status?: string;
}

const ChatWithEve = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eveData, setEveData] = useState<EveData | null>(null);
  const [myEmployees, setMyEmployees] = useState<EveData[]>([]);
  const [isFromOffice, setIsFromOffice] = useState(false);
  const [eveIsTyping, setEveIsTyping] = useState(false);

  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, eveIsTyping]);

  // Load employees
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/");
      return;
    }

    const loadEmployees = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/eve-employee/my-employee`,
          {
            headers: {
              authorization: `employee${token}`,
            },
          }
        );
        const data = await res.json();
        if (!data.employees) return;

        const withPhotos = data.employees.map((emp: EveData) => ({
          ...emp,
          photoUrl: emp.photoUrl
            ? `${process.env.NEXT_PUBLIC_BASE_URL}${emp.photoUrl}`
            : undefined,
        }));
        setMyEmployees(withPhotos);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };

    loadEmployees();
  }, [router]);

  // Load messages per employee
  useEffect(() => {
    if (eveData?.id) {
      const saved = localStorage.getItem(`chat_${eveData.id}`);
      if (saved) setMessages(JSON.parse(saved));
    }
  }, [eveData]);

  // Save messages on change
  useEffect(() => {
    if (eveData?.id) {
      localStorage.setItem(`chat_${eveData.id}`, JSON.stringify(messages));
    }
  }, [messages, eveData]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() && !file) return;

    if (!eveData?.id) {
      toast({
        title: "Please select an employee",
        description: "You must select an employee before sending a message.",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date();
    const localFile = file;
    const localInput = input.trim();

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      content: localInput || "Sent a file",
      timestamp,
      type: localFile ? "file" : "text",
      ...(localFile && {
        fileUrl: URL.createObjectURL(localFile),
        fileName: localFile.name,
      }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setFile(null);
    setEveIsTyping(true);
    setIsLoading(true);

    try {
      const formData = new FormData();
      if (localFile) formData.append("file", localFile);
      formData.append("message", localInput);
      formData.append("employeeId", eveData.id);

      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/chat`, {
        method: "POST",
        headers: { authorization: `employee${localStorage.getItem("token")}` },
        body: formData,
      });

      const data = await res.json();

      const eveResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: "eve",
        content: data.reply,
        timestamp: new Date(),
        type: "text",
      };

      setMessages((prev) => [...prev, eveResponse]);
    } catch (err) {
      console.error("API error:", err);
      toast({
        title: "Error",
        description: "Failed to get response from EVE.",
        variant: "destructive",
      });
    } finally {
      setEveIsTyping(false);
      setIsLoading(false);
      if (localFile) {
        URL.revokeObjectURL(userMessage.fileUrl!);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 text-white">
      {/* ===== Header ===== */}
      <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push(isFromOffice ? "/virtual-office" : "/home")}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft />
        </Button>

        <div className="flex items-center gap-3">
          <Avatar>
            {eveData?.photoUrl ? (
              <AvatarImage src={eveData.photoUrl} alt="avatar" />
            ) : (
              <AvatarFallback>{eveData?.name?.[0] || "E"}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <h2 className="font-semibold">{eveData?.name || "EVE"}</h2>
            <p className="text-sm text-indigo-200">
              {eveData?.department || "AI Assistant"}
            </p>
          </div>
          {eveData?.status && (
            <Badge variant="outline" className="text-xs border-indigo-400">
              {eveData.status}
            </Badge>
          )}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ChevronDown />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-white text-black">
            <h4 className="font-semibold mb-2">Employees</h4>
            <ul className="space-y-1 max-h-60 overflow-y-auto">
              {myEmployees.map((emp) => (
                <li
                  key={emp.id}
                  className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                  onClick={() => setEveData(emp)}
                >
                  <p className="font-medium">{emp.name}</p>
                  <p className="text-xs text-gray-500">{emp.department}</p>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>

      {/* ===== Messages ===== */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-md ${msg.sender === "user"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                    : "bg-white/10 border border-white/10 text-white"
                  }`}
              >
                {msg.type === "file" && msg.fileUrl ? (
                  <a
                    href={msg.fileUrl}
                    download={msg.fileName}
                    className="underline text-sm block"
                  >
                    {msg.fileName}
                  </a>
                ) : (
                  <p className="text-sm break-words">{msg.content}</p>
                )}
              </div>
              <span className="text-[10px] opacity-60 mt-1">
                {format(new Date(msg.timestamp), "HH:mm")}
              </span>
            </div>
          ))}

          {eveIsTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <Card className="px-4 py-2 bg-white/10 border border-white/10 rounded-2xl text-sm text-gray-200 italic">
                <CardContent className="p-0">
                  {eveData?.name || "EVE"} is typing...
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* ===== Input ===== */}
      <div className="bg-white/5 p-4 border-t border-white/10">
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <Input
            placeholder={
              eveData ? `Message ${eveData.name}...` : "Select employee..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!eveData || isLoading}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) {
                setFile(selected);
                toast({ title: "File selected", description: selected.name });
              }
            }}
          />
          <Button
            variant="ghost"
            className="text-white hover:bg-white/10"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={(!input.trim() && !file) || isLoading || !eveData}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex gap-1"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send />}
          </Button>
        </div>
        {file && (
          <div className="text-xs text-white mt-2 flex items-center justify-between bg-white/10 p-2 rounded">
            <span className="truncate">{file.name}</span>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-400 hover:text-red-600"
              onClick={() => setFile(null)}
            >
              Remove
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWithEve;
