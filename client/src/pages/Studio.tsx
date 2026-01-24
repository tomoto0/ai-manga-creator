import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { 
  Sparkles, Newspaper, Image, MessageSquare, Eye, Download, Share2, 
  ArrowLeft, ArrowRight, Check, Loader2, RefreshCw, Edit2, X, ChevronLeft, User, Palette
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage, LanguageSwitcher } from "@/contexts/LanguageContext";

type WorkflowStep = "news" | "story" | "panels" | "dialogue" | "preview";

interface NewsItem {
  title: string;
  url: string;
  summary: string;
  source: string;
  publishedAt: string;
}

interface StoryProposal {
  plotTitle: string;
  plotDescription: string;
  panelCount: number;
  keyThemes: string[];
}

interface PanelData {
  panelNumber: number;
  sceneDescription: string;
  imagePrompt: string;
  dialogue: string;
  imageUrl?: string;
  dialoguePosition?: "top" | "middle" | "bottom";
  bubbleShape?: "round" | "square" | "jagged";
}

type LayoutType = "2x2" | "2x3" | "3x2" | "1-column";

const STEPS: { id: WorkflowStep; label: string; icon: React.ElementType }[] = [
  { id: "news", label: "Select News", icon: Newspaper },
  { id: "story", label: "Choose Story", icon: Sparkles },
  { id: "panels", label: "Generate Panels", icon: Image },
  { id: "dialogue", label: "Edit Dialogue", icon: MessageSquare },
  { id: "preview", label: "Preview & Export", icon: Eye },
];

export default function Studio() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("news");
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [storyProposals, setStoryProposals] = useState<StoryProposal[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryProposal | null>(null);
  const [panels, setPanels] = useState<PanelData[]>([]);
  const [generatingImages, setGeneratingImages] = useState<number[]>([]);
  const [editingPanel, setEditingPanel] = useState<number | null>(null);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [jpegPreviewUrl, setJpegPreviewUrl] = useState<string | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>("2x3");
  
  // Character settings for visual consistency
  const [mainCharacter, setMainCharacter] = useState<string>("");
  const [supportingCharacter, setSupportingCharacter] = useState<string>("");
  const [artStyle, setArtStyle] = useState<string>("");
  
  const { t } = useLanguage();

  const fetchNewsMutation = trpc.ai.fetchLatestNews.useMutation();
  const generateStoryMutation = trpc.ai.generateStoryProposals.useMutation();
  const generatePanelsMutation = trpc.ai.generatePanelPrompts.useMutation();
  const generateImageMutation = trpc.ai.generateImage.useMutation();
  const createProjectMutation = trpc.manga.createProject.useMutation();
  const generateJPEGMutation = trpc.manga.generateJPEG.useMutation();
  const publishMangaMutation = trpc.manga.publishManga.useMutation();

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access the manga studio</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <a href={getLoginUrl()}>
              <Button className="gradient-purple text-white border-0">
                Sign In
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFetchNews = async () => {
    try {
      const news = await fetchNewsMutation.mutateAsync({});
      setNewsItems(news);
      toast.success("Latest news loaded!");
    } catch (error) {
      toast.error("Failed to fetch news");
    }
  };

  const handleSelectNews = async (news: NewsItem) => {
    setSelectedNews(news);
    try {
      const project = await createProjectMutation.mutateAsync({
        projectTitle: news.title,
        sourceNewsUrl: news.url,
      });
      setProjectId(project.id);
      setCurrentStep("story");
      
      // Generate story proposals
      const proposals = await generateStoryMutation.mutateAsync({
        newsContent: news.summary,
        newsTitle: news.title,
      });
      setStoryProposals(proposals);
      toast.success("Story proposals generated!");
    } catch (error) {
      toast.error("Failed to generate stories");
    }
  };

  const handleSelectStory = async (story: StoryProposal) => {
    setSelectedStory(story);
    setCurrentStep("panels");
    
    try {
      // Build character settings string for image generation
      const characterSettings = [
        mainCharacter && `Main character: ${mainCharacter}`,
        supportingCharacter && `Supporting character: ${supportingCharacter}`,
        artStyle && `Art style: ${artStyle}`,
      ].filter(Boolean).join(". ");
      
      const panelPrompts = await generatePanelsMutation.mutateAsync({
        plotTitle: story.plotTitle,
        plotDescription: story.plotDescription,
        panelCount: story.panelCount,
        keyThemes: story.keyThemes,
        newsContent: selectedNews?.summary,
        characterSettings: characterSettings || undefined,
      });
      
      setPanels(panelPrompts.map(p => ({
        panelNumber: p.panelNumber,
        sceneDescription: p.sceneDescription,
        imagePrompt: p.imagePrompt,
        dialogue: p.dialogue,
      })));
      toast.success("Panel prompts generated!");
    } catch (error) {
      toast.error("Failed to generate panel prompts");
    }
  };

  const handleGenerateImage = async (panelIndex: number) => {
    const panel = panels[panelIndex];
    if (!panel) return;

    setGeneratingImages(prev => [...prev, panelIndex]);
    
    try {
      // Get previous panel's image for consistency
      const previousImageUrl = panelIndex > 0 ? panels[panelIndex - 1]?.imageUrl : undefined;
      
      // Build enhanced prompt with character settings for consistency
      let enhancedPrompt = panel.imagePrompt;
      
      // Add character settings to prompt for visual consistency
      const characterContext = [];
      if (mainCharacter) characterContext.push(`Main character: ${mainCharacter}`);
      if (supportingCharacter) characterContext.push(`Supporting character: ${supportingCharacter}`);
      if (artStyle) characterContext.push(`Art style: ${artStyle}`);
      
      if (characterContext.length > 0) {
        enhancedPrompt = `${characterContext.join(". ")}. ${enhancedPrompt}`;
      }
      
      // Add consistency instruction
      if (panelIndex === 0) {
        enhancedPrompt += " Establish consistent character designs, art style, and visual tone for the entire manga series.";
      } else {
        enhancedPrompt += " Maintain the EXACT SAME character designs, art style, facial features, clothing, and visual tone as the previous panels. Ensure visual continuity.";
      }
      
      const result = await generateImageMutation.mutateAsync({
        prompt: enhancedPrompt,
        previousImageUrl,
      });
      
      setPanels(prev => prev.map((p, i) => 
        i === panelIndex ? { ...p, imageUrl: result.url } : p
      ));
      toast.success(`Panel ${panelIndex + 1} image generated!`);
    } catch (error) {
      toast.error(`Failed to generate image for panel ${panelIndex + 1}`);
    } finally {
      setGeneratingImages(prev => prev.filter(i => i !== panelIndex));
    }
  };

  const handleGenerateAllImages = async () => {
    setGeneratingImages([0]); // Start with first panel
    
    // Track generated image URLs locally to ensure consistency
    const generatedUrls: (string | undefined)[] = [...panels.map(p => p.imageUrl)];
    
    for (let i = 0; i < panels.length; i++) {
      if (!generatedUrls[i]) {
        try {
          // Get the previous panel's image URL from our local tracking
          // This ensures we always have the most recent URL even before state updates
          const previousImageUrl = i > 0 ? generatedUrls[i - 1] : undefined;
          
          // Build enhanced prompt with character settings for consistency
          let enhancedPrompt = panels[i].imagePrompt;
          
          // Add character settings to prompt for visual consistency
          const characterContext = [];
          if (mainCharacter) characterContext.push(`Main character: ${mainCharacter}`);
          if (supportingCharacter) characterContext.push(`Supporting character: ${supportingCharacter}`);
          if (artStyle) characterContext.push(`Art style: ${artStyle}`);
          
          if (characterContext.length > 0) {
            enhancedPrompt = `${characterContext.join(". ")}. ${enhancedPrompt}`;
          }
          
          // Add consistency instruction
          if (i === 0) {
            enhancedPrompt += " Establish consistent character designs, art style, and visual tone for the entire manga series.";
          } else {
            enhancedPrompt += " Maintain the EXACT SAME character designs, art style, facial features, clothing, and visual tone as the previous panels. Ensure visual continuity.";
          }
          
          const result = await generateImageMutation.mutateAsync({
            prompt: enhancedPrompt,
            previousImageUrl,
          });
          
          // Store the generated URL in our local tracking
          generatedUrls[i] = result.url;
          
          // Update panels state immediately after each generation
          setPanels(prev => prev.map((p, idx) => 
            idx === i ? { ...p, imageUrl: result.url } : p
          ));
          
          toast.success(`Panel ${i + 1} image generated!`);
          
          // Update generating state to show next panel
          if (i < panels.length - 1) {
            setGeneratingImages([i + 1]);
          }
        } catch (error) {
          toast.error(`Failed to generate image for panel ${i + 1}`);
          setGeneratingImages([]);
          break; // Stop on error
        }
      }
    }
    
    setGeneratingImages([]);
  };

  const handleUpdateDialogue = (panelIndex: number, dialogue: string) => {
    setPanels(prev => prev.map((p, i) => 
      i === panelIndex ? { ...p, dialogue } : p
    ));
  };

  const handleDownloadJPEG = async () => {
    if (!projectId || !selectedStory) return;
    
    try {
      const result = await generateJPEGMutation.mutateAsync({
        projectId,
        title: selectedStory.plotTitle,
        layout: selectedLayout,
        panels: panels.map(p => ({
          panelNumber: p.panelNumber,
          imageUrl: p.imageUrl,
          dialogue: p.dialogue,
          dialoguePosition: p.dialoguePosition,
          bubbleShape: p.bubbleShape,
        })),
      });
      
      // Show preview modal
      setJpegPreviewUrl(result.url);
      
      // Also trigger download
      const link = document.createElement('a');
      link.href = result.url;
      link.download = `manga-${selectedStory.plotTitle.replace(/\s+/g, '-')}.jpg`;
      link.click();
      toast.success("Manga downloaded!");
    } catch (error) {
      toast.error("Failed to generate JPEG");
    }
  };

  const handlePublish = async () => {
    if (!projectId) return;
    
    try {
      await publishMangaMutation.mutateAsync({
        projectId,
        panels: panels.map(p => ({
          panelNumber: p.panelNumber,
          sceneDescription: p.sceneDescription,
          imageUrl: p.imageUrl || "",
          dialogue: p.dialogue,
        })),
      });
      toast.success("Manga published to gallery!");
    } catch (error) {
      toast.error("Failed to publish manga");
    }
  };

  const handleShareToX = () => {
    if (!selectedStory) return;
    const mangaTitle = selectedStory.plotTitle;
    const text = encodeURIComponent(`🎨 AIで漫画を作りました！\n\n「${mangaTitle}」\n\n#AI漫画 #AIアート #AIMangaCreator`);
    // 画像URLがあれば含める
    let shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
    if (jpegPreviewUrl) {
      shareUrl += `&url=${encodeURIComponent(jpegPreviewUrl)}`;
    }
    window.open(shareUrl, '_blank');
    toast.success("Xへの共有画面を開きました");
  };

  const getStepIndex = (step: WorkflowStep) => STEPS.findIndex(s => s.id === step);
  const progress = ((getStepIndex(currentStep) + 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="font-bold text-lg">Manga Studio</h1>
          <div className="w-24" />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="border-b border-border bg-card/30">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = getStepIndex(currentStep) > index;
              const Icon = step.icon;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`
                    step-indicator
                    ${isActive ? 'active' : ''}
                    ${isCompleted ? 'completed' : ''}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`ml-2 text-sm font-medium hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div className={`w-8 sm:w-16 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container py-8">
        {/* Step 1: News Selection */}
        {currentStep === "news" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Select a News Story</h2>
              <p className="text-muted-foreground">Choose a news article to transform into manga</p>
            </div>

            {newsItems.length === 0 ? (
              <Card className="p-12 text-center">
                <Newspaper className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No News Loaded</h3>
                <p className="text-muted-foreground mb-6">Click the button below to fetch the latest news</p>
                <Button 
                  onClick={handleFetchNews}
                  disabled={fetchNewsMutation.isPending}
                  className="gradient-purple text-white border-0"
                >
                  {fetchNewsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading News...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Fetch Latest News
                    </>
                  )}
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Button 
                    variant="outline" 
                    onClick={handleFetchNews}
                    disabled={fetchNewsMutation.isPending}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${fetchNewsMutation.isPending ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                {newsItems.map((news, index) => (
                  <div
                    key={index}
                    className={`news-card ${selectedNews === news ? 'selected' : ''}`}
                    onClick={() => handleSelectNews(news)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/20 text-primary">
                            {news.source}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(news.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{news.title}</h3>
                        <p className="text-muted-foreground text-sm line-clamp-2">{news.summary}</p>
                      </div>
                      <Button 
                        size="sm" 
                        className="gradient-purple text-white border-0 shrink-0"
                        disabled={generateStoryMutation.isPending}
                      >
                        {generateStoryMutation.isPending && selectedNews === news ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            Select
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Story Selection */}
        {currentStep === "story" && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t.studio.story.title}</h2>
              <p className="text-muted-foreground">{t.studio.story.description}</p>
            </div>

            {/* Character Settings Section */}
            <Card className="mb-8 border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{t.studio.story.characterSettings}</CardTitle>
                </div>
                <CardDescription>{t.studio.story.characterSettingsDescription}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mainCharacter">{t.studio.story.mainCharacter}</Label>
                  <Input
                    id="mainCharacter"
                    placeholder={t.studio.story.mainCharacterPlaceholder}
                    value={mainCharacter}
                    onChange={(e) => setMainCharacter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportingCharacter">{t.studio.story.supportingCharacter}</Label>
                  <Input
                    id="supportingCharacter"
                    placeholder={t.studio.story.supportingCharacterPlaceholder}
                    value={supportingCharacter}
                    onChange={(e) => setSupportingCharacter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="artStyle" className="flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    {t.studio.story.artStyle}
                  </Label>
                  <Input
                    id="artStyle"
                    placeholder={t.studio.story.artStylePlaceholder}
                    value={artStyle}
                    onChange={(e) => setArtStyle(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {generateStoryMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="spinner mb-4" />
                <p className="text-muted-foreground">{t.studio.story.generating}</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {storyProposals.map((story, index) => (
                  <Card 
                    key={index}
                    className={`card-hover cursor-pointer transition-all ${selectedStory === story ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => handleSelectStory(story)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl">{story.plotTitle}</CardTitle>
                          <CardDescription className="mt-2">
                            {story.panelCount} panels • {story.keyThemes.join(", ")}
                          </CardDescription>
                        </div>
                        <Button 
                          size="sm" 
                          className="gradient-purple text-white border-0"
                          disabled={generatePanelsMutation.isPending}
                        >
                          {generatePanelsMutation.isPending && selectedStory === story ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Select"
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{story.plotDescription}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {story.keyThemes.map((theme, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent-foreground">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex justify-start mt-8">
              <Button variant="outline" onClick={() => setCurrentStep("news")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to News
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Panel Generation */}
        {currentStep === "panels" && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Generate Panel Images</h2>
              <p className="text-muted-foreground">Generate manga images for each panel</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
              <Button 
                onClick={handleGenerateAllImages}
                disabled={generatingImages.length > 0}
                className="gradient-purple text-white border-0"
              >
                {generatingImages.length > 0 ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate All Images
                  </>
                )}
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {panels.map((panel, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="aspect-square relative bg-muted">
                    {panel.imageUrl ? (
                      <img 
                        src={panel.imageUrl} 
                        alt={`Panel ${panel.panelNumber}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {generatingImages.includes(index) ? (
                          <div className="text-center">
                            <div className="spinner mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">Generating...</p>
                          </div>
                        ) : (
                          <div className="text-center p-4">
                            <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground mb-2">{panel.sceneDescription}</p>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleGenerateImage(index)}
                            >
                              Generate
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-sm font-bold">
                      #{panel.panelNumber}
                    </div>
                    {panel.imageUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
                        onClick={() => handleGenerateImage(index)}
                        disabled={generatingImages.includes(index)}
                      >
                        <RefreshCw className={`w-4 h-4 ${generatingImages.includes(index) ? 'animate-spin' : ''}`} />
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{panel.dialogue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentStep("story")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Story
              </Button>
              <Button 
                onClick={() => setCurrentStep("dialogue")}
                disabled={panels.some(p => !p.imageUrl)}
                className="gradient-purple text-white border-0"
              >
                Continue to Dialogue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Dialogue Editing */}
        {currentStep === "dialogue" && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Edit Dialogue</h2>
              <p className="text-muted-foreground">Customize the dialogue for each panel</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {panels.map((panel, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="flex">
                    <div className="w-1/3 aspect-square relative bg-muted shrink-0">
                      {panel.imageUrl && (
                        <img 
                          src={panel.imageUrl} 
                          alt={`Panel ${panel.panelNumber}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-sm font-bold">
                        #{panel.panelNumber}
                      </div>
                    </div>
                    <CardContent className="flex-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Dialogue</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingPanel(editingPanel === index ? null : index)}
                        >
                          {editingPanel === index ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </Button>
                      </div>
                      {editingPanel === index ? (
                        <div className="space-y-3">
                          <Textarea
                            value={panel.dialogue}
                            onChange={(e) => handleUpdateDialogue(index, e.target.value)}
                            className="min-h-[100px]"
                            placeholder="Enter dialogue..."
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Bubble Shape</label>
                              <select 
                                className="w-full px-2 py-1 text-sm border rounded"
                                value={panel.bubbleShape || "round"}
                                onChange={(e) => {
                                  setPanels(prev => prev.map((p, i) => 
                                    i === index ? { ...p, bubbleShape: e.target.value as "round" | "square" | "jagged" } : p
                                  ));
                                }}
                              >
                                <option value="round">Round</option>
                                <option value="square">Square</option>
                                <option value="jagged">Jagged</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Position</label>
                              <select 
                                className="w-full px-2 py-1 text-sm border rounded"
                                value={panel.dialoguePosition || "bottom"}
                                onChange={(e) => {
                                  setPanels(prev => prev.map((p, i) => 
                                    i === index ? { ...p, dialoguePosition: e.target.value as "top" | "middle" | "bottom" } : p
                                  ));
                                }}
                              >
                                <option value="top">Top</option>
                                <option value="middle">Middle</option>
                                <option value="bottom">Bottom</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">{panel.dialogue || "No dialogue"}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            <span>{panel.bubbleShape || "round"}</span>
                            <span>•</span>
                            <span>{panel.dialoguePosition || "bottom"}</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentStep("panels")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Panels
              </Button>
              <Button 
                onClick={() => setCurrentStep("preview")}
                className="gradient-purple text-white border-0"
              >
                Preview Manga
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 5: Preview & Export */}
        {currentStep === "preview" && (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{selectedStory?.plotTitle}</h2>
              <p className="text-muted-foreground">Preview your manga and export</p>
            </div>

            {/* Layout Selection */}
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 bg-card rounded-lg border border-border p-1">
                <span className="text-sm text-muted-foreground px-2">Layout:</span>
                <button
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedLayout === "2x2" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedLayout("2x2")}
                >
                  2x2
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedLayout === "2x3" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedLayout("2x3")}
                >
                  2x3
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedLayout === "3x2" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedLayout("3x2")}
                >
                  3x2
                </button>
                <button
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    selectedLayout === "1-column" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                  onClick={() => setSelectedLayout("1-column")}
                >
                  1 Column
                </button>
              </div>
            </div>

            {/* Manga Preview Grid */}
            <div className="bg-card rounded-2xl border border-border p-8 mb-8">
              <div className={`grid gap-4 ${
                selectedLayout === "2x2" ? "grid-cols-2" :
                selectedLayout === "2x3" ? "grid-cols-2" :
                selectedLayout === "3x2" ? "grid-cols-3" :
                "grid-cols-1"
              }`}>
                {panels.map((panel, index) => (
                  <div key={index} className="manga-panel">
                    <div className="aspect-square relative">
                      {panel.imageUrl && (
                        <img 
                          src={panel.imageUrl} 
                          alt={`Panel ${panel.panelNumber}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold">
                        #{panel.panelNumber}
                      </div>
                    </div>
                    {panel.dialogue && (
                      <div className="p-3 bg-card/80 border-t border-border">
                        <p className="text-sm">{panel.dialogue}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={handleDownloadJPEG}
                disabled={generateJPEGMutation.isPending}
                className="gradient-purple text-white border-0"
              >
                {generateJPEGMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download JPEG
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={publishMangaMutation.isPending}
                variant="outline"
              >
                {publishMangaMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save to Gallery
              </Button>
              <Button 
                onClick={handleShareToX}
                variant="outline"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share to X
              </Button>
            </div>

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentStep("dialogue")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dialogue
              </Button>
              <Link href="/gallery">
                <Button variant="outline">
                  View Gallery
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* JPEG Preview Modal */}
      {jpegPreviewUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4"
        >
          {/* Top action bar */}
          <div className="w-full max-w-7xl flex justify-between items-center mb-4">
            <Button
              variant="outline"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => setJpegPreviewUrl(null)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.common.back}
            </Button>
            <h2 className="text-white text-lg font-semibold">Generated Manga Preview</h2>
            <Button
              className="gradient-purple text-white border-0"
              onClick={() => setJpegPreviewUrl(null)}
            >
              <Check className="w-4 h-4 mr-2" />
              {t.common.done}
            </Button>
          </div>
          
          {/* Image container */}
          <div className="relative max-w-7xl max-h-[75vh] w-full flex-1 flex items-center justify-center">
            <img 
              src={jpegPreviewUrl} 
              alt="Generated Manga" 
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          
          {/* Bottom action bar */}
          <div className="w-full max-w-7xl flex justify-center gap-4 mt-4">
            <Button
              variant="outline"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={() => {
                const link = document.createElement('a');
                link.href = jpegPreviewUrl;
                link.download = `manga-${Date.now()}.jpg`;
                link.click();
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              {t.studio.preview.downloadJPEG}
            </Button>
            <Button
              variant="outline"
              className="bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={handleShareToX}
            >
              <Share2 className="w-4 h-4 mr-2" />
              {t.studio.preview.shareToX}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
