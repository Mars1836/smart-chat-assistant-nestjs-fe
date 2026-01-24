
"use client";

import { Suspense, use } from "react";
import { AppLayout } from "@/components/app-layout";
import { ChatbotKnowledgeSettings } from "@/components/knowledge/chatbot-knowledge-settings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{ id: string }>;
}

function ChatbotSettingsContent({ id }: { id: string }) {
  const router = useRouter();

  return (
    <AppLayout activeModule="chatbots">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Chatbots
          </Button>
        </div>

        <div>
            <h1 className="text-3xl font-bold">Chatbot Settings</h1>
            <p className="text-muted-foreground">Configure your chatbot behavior and knowledge</p>
        </div>

        <Tabs defaultValue="knowledge" className="w-full">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="mt-6">
            <div className="p-4 border rounded-lg bg-muted/10 text-center text-muted-foreground">
                General settings (Use the Edit form in the list page for now)
            </div>
          </TabsContent>
          
          <TabsContent value="knowledge" className="mt-6">
             <ChatbotKnowledgeSettings chatbotId={id} />
          </TabsContent>

          <TabsContent value="plugins" className="mt-6">
             <div className="p-4 border rounded-lg bg-muted/10 text-center text-muted-foreground">
                Plugins settings (Use the Plugins dialog in the list page for now)
            </div>
          </TabsContent>
          
          <TabsContent value="advanced" className="mt-6">
             <div className="p-4 border rounded-lg bg-muted/10 text-center text-muted-foreground">
                Advanced settings coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default function ChatbotSettingsPage({ params }: PageProps) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <ChatbotSettingsContent id={resolvedParams.id} />
        </Suspense>
    );
}
