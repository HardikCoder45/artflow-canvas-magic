
import ArtCanvas from "@/components/ArtCanvas";

const Index = () => {
  return (
    <div className="min-h-screen bg-artflow-dark-purple p-4 overflow-hidden">
      <header className="mb-4">
        <h1 className="text-3xl font-bold text-white text-center mb-2">
          <span className="text-artflow-purple">Art</span>Flow Canvas
        </h1>
        <p className="text-center text-gray-300">Create beautiful digital art with interactive tools</p>
      </header>
      
      <main className="container mx-auto">
        <ArtCanvas />
      </main>
    </div>
  );
};

export default Index;
