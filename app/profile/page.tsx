"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Loader2, ArrowLeft, Moon, Sun, Bell } from "lucide-react";
import { usersApi, type UserProfileDto } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    language: "vi",
  });
  
  // Preferences State (Mock)
  const [preferences, setPreferences] = useState({
    theme: "light",
    notifications: true,
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await usersApi.getProfile();
      setProfile(data);
      setFormData({
        name: data.name,
        email: data.email,
        language: data.language || "vi",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Không tải được profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await usersApi.updateProfile({
        name: formData.name,
        email: formData.email,
        language: formData.language,
      });
      toast.success("Đã lưu thay đổi");
      setIsEditing(false);
      await loadProfile();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      if (e?.response?.status === 409) toast.error("Email đã được user khác sử dụng");
      else toast.error(e?.response?.data?.message ?? "Không lưu được");
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">User Settings</h1>
            <p className="text-muted-foreground">Manage profile and preferences</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Section */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm" disabled>
                      Change Avatar
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ngôn ngữ</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                      value={formData.language}
                      onChange={(e) =>
                        setFormData({ ...formData, language: e.target.value })
                      }
                      disabled={!isEditing}
                    >
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button onClick={handleSaveProfile}>Save Changes</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <Label>Theme</Label>
                  </div>
                  <div className="flex items-center gap-2 border rounded-md p-1">
                    <Button 
                      variant={preferences.theme === 'light' ? 'secondary' : 'ghost'} 
                      size="sm"
                      onClick={() => setPreferences(p => ({ ...p, theme: 'light' }))}
                    >
                      Light
                    </Button>
                    <Button 
                      variant={preferences.theme === 'dark' ? 'secondary' : 'ghost'} 
                      size="sm"
                      onClick={() => setPreferences(p => ({ ...p, theme: 'dark' }))}
                    >
                      Dark
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>Notifications</Label>
                  </div>
                  <Switch 
                    checked={preferences.notifications}
                    onCheckedChange={(checked: boolean) => setPreferences(p => ({ ...p, notifications: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security Section */}
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
