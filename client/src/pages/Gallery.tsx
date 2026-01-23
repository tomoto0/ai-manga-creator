import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { 
  Sparkles, Image, ArrowRight, ChevronLeft, Share2, Download, ExternalLink,
  Calendar, Loader2
} from "lucide-react";

export default function Gallery() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { data: mangaList, isLoading } = trpc.manga.getGallery.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Redirect if not authenticated
  if (!authLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to view your gallery</CardDescription>
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

  const handleShareToX = (manga: { title: string }) => {
    const text = encodeURIComponent(`Check out my AI-generated manga: "${manga.title}" - Created with AI Manga Creator`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <h1 className="font-bold text-lg">My Gallery</h1>
          <Link href="/studio">
            <Button size="sm" className="gradient-purple text-white border-0">
              <Sparkles className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Manga Collection</h2>
          <p className="text-muted-foreground">All your created manga in one place</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your gallery...</p>
          </div>
        ) : !mangaList || mangaList.length === 0 ? (
          <Card className="p-12 text-center">
            <Image className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No Manga Yet</h3>
            <p className="text-muted-foreground mb-6">Start creating your first manga from the latest news!</p>
            <Link href="/studio">
              <Button className="gradient-purple text-white border-0">
                <Sparkles className="w-4 h-4 mr-2" />
                Create Your First Manga
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mangaList.map((manga) => (
              <Card key={manga.id} className="overflow-hidden card-hover">
                <div className="aspect-video relative bg-muted">
                  {manga.finalImageUrl ? (
                    <img 
                      src={manga.finalImageUrl} 
                      alt={manga.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  {manga.xPostId && (
                    <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs flex items-center gap-1">
                      <Share2 className="w-3 h-3" />
                      Shared
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{manga.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(manga.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    {manga.finalImageUrl && (
                      <a href={manga.finalImageUrl} download target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </a>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShareToX(manga)}
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    {manga.sourceNewsUrl && (
                      <a href={manga.sourceNewsUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
