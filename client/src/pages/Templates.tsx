import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Grid, Layout, Loader2, Plus, Sparkles, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Templates() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"my" | "public">("my");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // フォーム状態
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateLayout, setNewTemplateLayout] = useState<"2x2" | "2x3" | "3x2" | "1-column">("2x3");
  const [newTemplatePanelCount, setNewTemplatePanelCount] = useState(4);
  const [newTemplateBubbleShape, setNewTemplateBubbleShape] = useState<"round" | "square" | "jagged">("round");
  const [newTemplateDialoguePosition, setNewTemplateDialoguePosition] = useState<"top" | "middle" | "bottom">("bottom");
  const [newTemplateIsPublic, setNewTemplateIsPublic] = useState(false);

  const { data: myTemplates, isLoading: myTemplatesLoading, refetch: refetchMyTemplates } = trpc.templates.list.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  const { data: publicTemplates, isLoading: publicTemplatesLoading } = trpc.templates.listPublic.useQuery();

  const createTemplateMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success("テンプレートを作成しました");
      setIsCreateDialogOpen(false);
      resetForm();
      refetchMyTemplates();
    },
    onError: (error) => {
      toast.error("テンプレートの作成に失敗しました: " + error.message);
    },
  });

  const deleteTemplateMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("テンプレートを削除しました");
      refetchMyTemplates();
    },
    onError: (error) => {
      toast.error("テンプレートの削除に失敗しました: " + error.message);
    },
  });

  const resetForm = () => {
    setNewTemplateName("");
    setNewTemplateDescription("");
    setNewTemplateLayout("2x3");
    setNewTemplatePanelCount(4);
    setNewTemplateBubbleShape("round");
    setNewTemplateDialoguePosition("bottom");
    setNewTemplateIsPublic(false);
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error("テンプレート名を入力してください");
      return;
    }
    createTemplateMutation.mutate({
      name: newTemplateName,
      description: newTemplateDescription,
      layout: newTemplateLayout,
      panelCount: newTemplatePanelCount,
      defaultBubbleShape: newTemplateBubbleShape,
      defaultDialoguePosition: newTemplateDialoguePosition,
      isPublic: newTemplateIsPublic,
    });
  };

  const handleDeleteTemplate = (id: number) => {
    if (confirm("このテンプレートを削除しますか？")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const templates = activeTab === "my" ? myTemplates : publicTemplates;
  const isLoading = activeTab === "my" ? myTemplatesLoading : publicTemplatesLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* ナビゲーション */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span className="font-bold text-lg">AI Manga Creator</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/gallery" className="text-muted-foreground hover:text-foreground transition-colors">
              Gallery
            </Link>
            <Link href="/templates" className="text-foreground font-medium">
              Templates
            </Link>
            {isAuthenticated ? (
              <Link href="/studio">
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Create Manga
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button variant="default" className="bg-primary hover:bg-primary/90">
                  Sign In
                </Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* メインコンテンツ */}
      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">テンプレートギャラリー</h1>
            <p className="text-muted-foreground">
              過去に作成した漫画のスタイルをテンプレートとして保存し、再利用できます
            </p>
          </div>
          {isAuthenticated && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  新規テンプレート
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>新規テンプレート作成</DialogTitle>
                  <DialogDescription>
                    漫画のスタイル設定をテンプレートとして保存します
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">テンプレート名 *</Label>
                    <Input
                      id="name"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      placeholder="例: アクション漫画スタイル"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">説明</Label>
                    <Textarea
                      id="description"
                      value={newTemplateDescription}
                      onChange={(e) => setNewTemplateDescription(e.target.value)}
                      placeholder="テンプレートの説明を入力..."
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>レイアウト</Label>
                      <Select value={newTemplateLayout} onValueChange={(v) => setNewTemplateLayout(v as typeof newTemplateLayout)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2x2">2x2 (4コマ)</SelectItem>
                          <SelectItem value="2x3">2x3 (6コマ)</SelectItem>
                          <SelectItem value="3x2">3x2 (6コマ)</SelectItem>
                          <SelectItem value="1-column">1列縦型</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>パネル数</Label>
                      <Select value={String(newTemplatePanelCount)} onValueChange={(v) => setNewTemplatePanelCount(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <SelectItem key={n} value={String(n)}>{n}コマ</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>吹き出し形状</Label>
                      <Select value={newTemplateBubbleShape} onValueChange={(v) => setNewTemplateBubbleShape(v as typeof newTemplateBubbleShape)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="round">丸型</SelectItem>
                          <SelectItem value="square">角型</SelectItem>
                          <SelectItem value="jagged">ギザギザ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>セリフ位置</Label>
                      <Select value={newTemplateDialoguePosition} onValueChange={(v) => setNewTemplateDialoguePosition(v as typeof newTemplateDialoguePosition)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">上</SelectItem>
                          <SelectItem value="middle">中央</SelectItem>
                          <SelectItem value="bottom">下</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>公開設定</Label>
                      <p className="text-sm text-muted-foreground">
                        他のユーザーがこのテンプレートを使用できるようにする
                      </p>
                    </div>
                    <Switch
                      checked={newTemplateIsPublic}
                      onCheckedChange={setNewTemplateIsPublic}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={createTemplateMutation.isPending}>
                    {createTemplateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    作成
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* タブ */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === "my" ? "default" : "outline"}
            onClick={() => setActiveTab("my")}
            disabled={!isAuthenticated}
          >
            <Grid className="w-4 h-4 mr-2" />
            マイテンプレート
          </Button>
          <Button
            variant={activeTab === "public" ? "default" : "outline"}
            onClick={() => setActiveTab("public")}
          >
            <Users className="w-4 h-4 mr-2" />
            公開テンプレート
          </Button>
        </div>

        {/* テンプレート一覧 */}
        {!isAuthenticated && activeTab === "my" ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              マイテンプレートを表示するにはログインが必要です
            </p>
            <a href={getLoginUrl()}>
              <Button>ログイン</Button>
            </a>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {template.description || "説明なし"}
                      </CardDescription>
                    </div>
                    {template.isPublic && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                        公開
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Layout className="w-4 h-4 text-muted-foreground" />
                      <span>{template.layout}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-muted-foreground" />
                      <span>{template.panelCount}コマ</span>
                    </div>
                    <div className="text-muted-foreground">
                      吹き出し: {template.defaultBubbleShape === "round" ? "丸型" : template.defaultBubbleShape === "square" ? "角型" : "ギザギザ"}
                    </div>
                    <div className="text-muted-foreground">
                      使用回数: {template.usageCount || 0}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link href={`/studio?template=${template.id}`} className="flex-1">
                    <Button variant="default" className="w-full">
                      このテンプレートで作成
                    </Button>
                  </Link>
                  {activeTab === "my" && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteTemplate(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground mb-4">
              {activeTab === "my" ? "テンプレートがありません" : "公開テンプレートがありません"}
            </p>
            {activeTab === "my" && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                テンプレートを作成
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
