"use client"

import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Bot, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    fullName: "John Doe",
    email: "john@example.com",
    theme: "light",
    notifications: true,
  })

  const handleChange = (field: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <AppLayout activeModule="settings">
      <div className="p-6 space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full name</label>
              <Input
                value={settings.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="h-10"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">Save profile</Button>
          </CardContent>
        </Card>

        {/* Chatbots Management */}
        <Card>
          <CardHeader>
            <CardTitle>Chatbots</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Quản lý và cấu hình các chatbot của bạn
            </p>
            <Link href="/chatbots">
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90">
                <Bot className="w-4 h-4" />
                Quản lý Chatbot
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => handleChange("theme", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Enable notifications</label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleChange("notifications", e.target.checked)}
                className="w-4 h-4"
              />
            </div>
            <Button className="bg-primary hover:bg-primary/90">Save preferences</Button>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Deleting your account is permanent and cannot be undone.</p>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive/10 bg-transparent"
            >
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
