export const AdminNav = () => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
    <a 
      href="/admin/clubes" 
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-lg text-sm"
    >
      Admin Clubes
    </a>
    <a 
      href="/admin/estadios" 
      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md shadow-lg text-sm"
    >
      Admin Estádios
    </a>
  </div>
); 