import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Smartphone, Youtube, Mail, Phone, Loader2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const login = useAuthStore(s => s.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error || 'Error de autenticacion');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden h-[600px] z-10 m-4">
        {/* Form */}
        <div className="w-full md:w-1/2 p-10 flex flex-col justify-center relative bg-white z-20">
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl transform -rotate-6 hover:rotate-0 transition-transform duration-300">
              <Smartphone size={40} />
            </div>
            <h1 className="text-3xl font-black text-gray-800 tracking-tighter">ISACELL STORE</h1>
            <p className="text-red-600 font-bold tracking-widest text-xs uppercase mt-1">Cloud ERP Multi-Empresa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 px-4">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Usuario"
                className="w-full px-5 py-4 bg-gray-100 border-transparent focus:bg-white border focus:border-red-500 rounded-xl outline-none transition-all font-medium"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full px-5 py-4 bg-gray-100 border-transparent focus:bg-white border focus:border-red-500 rounded-xl outline-none transition-all font-medium"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 duration-200 ${
                isLoading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={18} className="animate-spin" /> CARGANDO...
                </span>
              ) : 'INICIAR SESION'}
            </button>
          </form>

          <div className="mt-auto pt-6 border-t flex flex-col items-center gap-4 text-xs">
            <p className="font-bold uppercase tracking-wider text-gray-400">Desarrollado por Isaias Gonzalez</p>
            <div className="flex gap-6">
              <a href="https://www.youtube.com/@ReparaTechRD" target="_blank" rel="noopener noreferrer">
                <Youtube size={22} className="text-gray-400 hover:text-red-600 transition duration-300" />
              </a>
              <a href="mailto:isacell.store@gmail.com">
                <Mail size={22} className="text-gray-400 hover:text-blue-500 transition duration-300" />
              </a>
              <a href="https://wa.me/18099755074" target="_blank" rel="noopener noreferrer">
                <Phone size={22} className="text-gray-400 hover:text-green-500 transition duration-300" />
              </a>
            </div>
          </div>
        </div>

        {/* Hero */}
        <div className="hidden md:flex w-1/2 bg-gray-900 relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-900/90 to-black/90 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1592890288564-76628a30a657?ixlib=rb-4.0.3" 
            alt="Tech" 
            className="absolute inset-0 w-full h-full object-cover" 
          />
          <div className="relative z-20 text-center text-white p-10">
            <h2 className="text-4xl font-bold mb-4">Gestion Inteligente</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              Control total de inventario, ventas, reparaciones y finanzas en una sola plataforma cloud.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
