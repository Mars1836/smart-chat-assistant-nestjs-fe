"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Loader2, ArrowLeft, Sun, Bell } from "lucide-react";
import { usersApi, type UserProfileDto } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/components/providers/language-provider";

export default function ProfilePage() {
  const router = useRouter();
  const { t, setLocale } = useLanguage();
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
      toast.error(t("profile.loadFailed"));
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
      toast.success(t("profile.saveSuccess"));
      setIsEditing(false);
      setLocale(formData.language === "en" ? "en" : "vi");
      await loadProfile();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string }; status?: number } };
      if (e?.response?.status === 409) toast.error(t("profile.emailUsed"));
      else toast.error(e?.response?.data?.message ?? t("profile.saveFailed"));
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
            <h1 className="text-3xl font-bold text-foreground">{t("profile.title")}</h1>
            <p className="text-muted-foreground">{t("profile.description")}</p>
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
                <CardTitle>{t("profile.infoTitle")}</CardTitle>
                <CardDescription>{t("profile.infoDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <Button variant="outline" size="sm" disabled>
                      {t("profile.changeAvatar")}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label>{t("profile.fullName")}</Label>
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
                    <Label>{t("common.language")}</Label>
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
                    <Button onClick={() => setIsEditing(true)}>{t("profile.edit")}</Button>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>{t("common.cancel")}</Button>
                      <Button onClick={handleSaveProfile}>{t("settings.saveChanges")}</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferences Section */}
            <Card>
              <CardHeader>
                <CardTitle>{t("profile.preferences")}</CardTitle>
                <CardDescription>{t("profile.preferencesDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-muted-foreground" />
                    <Label>{t("profile.theme")}</Label>
                  </div>
                  <div className="flex items-center gap-2 border rounded-md p-1">
                    <Button 
                      variant={preferences.theme === 'light' ? 'secondary' : 'ghost'} 
                      size="sm"
                      onClick={() => setPreferences(p => ({ ...p, theme: 'light' }))}
                    >
                      {t("profile.theme.light")}
                    </Button>
                    <Button 
                      variant={preferences.theme === 'dark' ? 'secondary' : 'ghost'} 
                      size="sm"
                      onClick={() => setPreferences(p => ({ ...p, theme: 'dark' }))}
                    >
                      {t("profile.theme.dark")}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <Label>{t("profile.notifications")}</Label>
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
                <CardTitle>{t("profile.security")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full justify-start">
                  {t("profile.changePassword")}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
