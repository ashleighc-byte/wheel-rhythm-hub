const OgImageDownload = () => {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = "/og-image.png";
    link.download = "freewheeler-og-image.png";
    link.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
        OG Social Image
      </h1>
      <img
        src="/og-image.png"
        alt="Free Wheeler OG social share image"
        className="max-w-2xl w-full rounded shadow-lg border-4 border-primary"
      />
      <button
        onClick={handleDownload}
        className="bg-secondary text-secondary-foreground font-display font-bold uppercase tracking-wider px-8 py-4 text-lg hover:opacity-90 transition-opacity rounded"
      >
        ⬇ Download PNG
      </button>
      <p className="font-body text-sm text-muted-foreground">
        1200 × 630px — ready to upload as your social share image when publishing
      </p>
    </div>
  );
};

export default OgImageDownload;
