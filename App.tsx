
import React, { useState, useEffect, useMemo } from 'react';
import { Role, UserProfile, Location, Order, OrderStatus, Category, Product } from './types';
import { CATEGORIES, INITIAL_LOCATION } from './constants';
import MapComponent from './components/MapComponent';
import Assistant from './components/Assistant';

const App: React.FC = () => {
  // --- CORE STATE ---
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState<'auth' | 'dashboard' | 'category' | 'checkout' | 'location_picker' | 'admin' | 'vendor_config'>('auth');
  const [location, setLocation] = useState<Location>(INITIAL_LOCATION);
  const [orders, setOrders] = useState<Order[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [checkoutItem, setCheckoutItem] = useState<{ name: string; isTaxi: boolean; price: number }>({ name: '', isTaxi: false, price: 0 });
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Auth state
  const [authData, setAuthData] = useState({ email: '', password: '', name: '', role: 'user' as Role, businessName: '' });
  const [isRegistering, setIsRegistering] = useState(false);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);

  // --- PERSISTENCE ---
  useEffect(() => {
    const savedUser = localStorage.getItem('domi_user');
    const savedOrders = localStorage.getItem('domi_orders');
    const savedRegisteredUsers = localStorage.getItem('domi_registered_users');
    const savedProducts = localStorage.getItem('domi_products');
    
    const defaults: UserProfile[] = [
      { uid: 'admin-001', name: 'Ivan Admin', email: 'arteagamartinivan@gmail.com', password: '24072212', role: 'admin' },
      { uid: 'user-001', name: 'Usuario Demo', email: 'usuario@gmail.com', password: '123456', role: 'user' },
      { uid: 'vendor-001', name: 'Dueño Burger', email: 'burger@domi.com', password: '123', role: 'vendor', businessName: 'Burgers Domi' }
    ];

    if (savedRegisteredUsers) setRegisteredUsers(JSON.parse(savedRegisteredUsers));
    else {
      setRegisteredUsers(defaults);
      localStorage.setItem('domi_registered_users', JSON.stringify(defaults));
    }
    
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    else {
      const defaultProds: Product[] = [
        { id: 'p1', vendorId: 'vendor-001', name: 'Hamburguesa Triple', price: 4500, category: 'food', emoji: '🍔' },
        { id: 'p2', vendorId: 'vendor-001', name: 'Papas Fritas XL', price: 2500, category: 'food', emoji: '🍟' }
      ];
      setProducts(defaultProds);
      localStorage.setItem('domi_products', JSON.stringify(defaultProds));
    }

    if (savedUser) {
      const u = JSON.parse(savedUser);
      setCurrentUser(u);
      setView(u.role === 'admin' ? 'admin' : 'dashboard');
    }
    
    if (savedOrders) setOrders(JSON.parse(savedOrders));
  }, []);

  useEffect(() => {
    if (currentUser) localStorage.setItem('domi_user', JSON.stringify(currentUser));
    localStorage.setItem('domi_orders', JSON.stringify(orders));
    localStorage.setItem('domi_registered_users', JSON.stringify(registeredUsers));
    localStorage.setItem('domi_products', JSON.stringify(products));
  }, [currentUser, orders, registeredUsers, products]);

  // --- UI ACTIONS ---
  const showAlert = (msg: string, type: 'success' | 'error' = 'success') => {
    const el = document.createElement('div');
    el.className = `fixed top-10 left-1/2 -translate-x-1/2 px-8 py-4 rounded-[2rem] text-white font-black text-sm shadow-2xl z-[10000] animate-in glass ${
      type === 'success' ? 'bg-green-600/90' : 'bg-red-600/90'
    }`;
    el.innerText = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.classList.add('opacity-0', '-translate-y-4');
      setTimeout(() => el.remove(), 500);
    }, 3000);
  };

  const handleAuth = () => {
    if (!authData.email || !authData.password) return showAlert("Completa todos los datos", "error");
    setLoading(true);
    
    setTimeout(() => {
      if (isRegistering) {
        if (registeredUsers.some(u => u.email === authData.email)) {
          setLoading(false);
          return showAlert("El email ya existe", "error");
        }
        const newUser: UserProfile = {
          uid: Math.random().toString(36).substr(2, 9),
          email: authData.email,
          name: authData.name || "Usuario",
          password: authData.password,
          role: authData.role,
          businessName: authData.businessName
        };
        setRegisteredUsers([...registeredUsers, newUser]);
        setCurrentUser(newUser);
        setView('dashboard');
        showAlert("¡Bienvenido a DOMI!", "success");
      } else {
        const found = registeredUsers.find(u => u.email === authData.email && u.password === authData.password);
        if (found) {
          setCurrentUser(found);
          setView(found.role === 'admin' ? 'admin' : 'dashboard');
          showAlert(`Hola de nuevo, ${found.name}`, "success");
        } else {
          showAlert("Credenciales incorrectas", "error");
        }
      }
      setLoading(false);
    }, 800);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('domi_user');
    setView('auth');
    setAuthData({ email: '', password: '', name: '', role: 'user', businessName: '' });
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            status, 
            partnerId: status === 'accepted' ? currentUser?.uid : o.partnerId,
            partnerName: status === 'accepted' ? currentUser?.name : o.partnerName,
            updatedAt: Date.now() 
          } 
        : o
    ));
    showAlert(`Pedido ${status.replace('_', ' ')}`, "success");
  };

  // --- STATS & LOGIC ---
  const activeOrdersForClient = useMemo(() => orders.filter(o => o.clientId === currentUser?.uid && o.status !== 'delivered'), [orders, currentUser]);
  const availableOrdersForPartner = useMemo(() => orders.filter(o => o.status === 'pending'), [orders]);
  const activeOrderForPartner = useMemo(() => orders.find(o => o.partnerId === currentUser?.uid && o.status !== 'delivered'), [orders, currentUser]);
  const vendorOrders = useMemo(() => orders.filter(o => o.vendorId === currentUser?.uid), [orders, currentUser]);
  const myProducts = useMemo(() => products.filter(p => p.vendorId === currentUser?.uid), [products, currentUser]);

  const partnerDailyCount = useMemo(() => 
    orders.filter(o => o.partnerId === currentUser?.uid && o.status === 'delivered').length
  , [orders, currentUser]);

  const adminStats = useMemo(() => {
    const totalRev = orders.reduce((acc, o) => acc + o.totalNum, 0);
    const catCounts: Record<string, number> = {};
    orders.forEach(o => catCounts[o.item] = (catCounts[o.item] || 0) + 1);
    const mostPopular = Object.entries(catCounts).sort((a,b) => b[1] - a[1])[0]?.[0] || 'N/A';
    
    const recs = [];
    if (orders.length > 5) recs.push(`🔥 Lo que más se mueve: ${mostPopular}. Sugiere a los comercios subir stock.`);
    if (registeredUsers.filter(u => u.role === 'vendor').length < 1) recs.push("🏬 Oportunidad: Faltan comercios. Llama a nuevos negocios.");
    if (recs.length === 0) recs.push("📈 Sistema estable. Monitoreando pedidos.");

    return { totalRev, orderCount: orders.length, userCount: registeredUsers.length, mostPopular, recs };
  }, [orders, registeredUsers]);

  // --- UNIFIED NAVBAR COMPONENT ---
  const Navbar = () => (
    <nav className="sticky top-0 z-[5000] glass px-4 md:px-8 py-4 flex justify-between items-center border-b border-slate-200/50 shadow-sm">
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <h1 
          onClick={() => {
            if (currentUser?.role === 'admin') setView('admin');
            else {
              setView('dashboard');
              setSelectedCategory(null);
            }
          }} 
          className="text-2xl md:text-3xl font-black text-blue-600 italic tracking-tighter cursor-pointer select-none"
        >
          DOMI
        </h1>
        <span className="hidden sm:inline-block bg-blue-50 px-2 py-0.5 rounded text-[7px] font-black uppercase text-blue-500 border border-blue-100">
          {currentUser?.role}
        </span>
      </div>

      <div className="flex items-center gap-2 md:gap-6 ml-auto">
        {currentUser?.role === 'user' && view === 'dashboard' && (
          <button 
            onClick={() => setView('location_picker')} 
            className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-slate-600 border border-slate-100 hover:bg-white transition-all max-w-[150px] truncate"
          >
            📍 {location.address || 'Ubicación'}
          </button>
        )}

        {currentUser?.role === 'vendor' && (
          <button 
            onClick={() => setView(view === 'vendor_config' ? 'dashboard' : 'vendor_config')} 
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-sm ${
              view === 'vendor_config' 
              ? 'bg-slate-800 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {view === 'vendor_config' ? '📦 Ver Pedidos' : '🏪 Mi Negocio'}
          </button>
        )}

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 md:pl-6">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-slate-800 uppercase leading-none truncate max-w-[100px]">
              {currentUser?.name}
            </p>
            <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">
              Usuario
            </p>
          </div>
          <button 
            onClick={logout} 
            className="bg-red-50 text-red-500 px-3 py-2 rounded-xl text-[9px] font-black uppercase border border-red-100 hover:bg-red-500 hover:text-white transition-all active:scale-95"
          >
            Salir
          </button>
        </div>
      </div>
    </nav>
  );

  // --- VIEWS ---

  if (view === 'auth') {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="max-w-md w-full bg-white p-10 rounded-[3.5rem] shadow-2xl border border-slate-100 text-center space-y-8 animate-in ring-1 ring-slate-200">
          <div>
            <h1 className="text-6xl font-black text-blue-600 tracking-tighter italic">DOMI</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em] mt-2 italic">Super App Urbana</p>
          </div>
          <div className="space-y-4 text-left">
            {isRegistering && (
              <>
                <input 
                  type="text" placeholder="Nombre completo" value={authData.name} 
                  onChange={e => setAuthData({...authData, name: e.target.value})}
                  className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900 placeholder:text-slate-400"
                />
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
                  {['user', 'delivery', 'vendor'].map(r => (
                    <button 
                      key={r}
                      onClick={() => setAuthData({...authData, role: r as Role})}
                      className={`p-3 rounded-xl text-[8px] font-black uppercase transition-all ${authData.role === r ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                    >
                      {r === 'user' ? 'Comprar' : r === 'delivery' ? 'Delivery' : 'Negocio'}
                    </button>
                  ))}
                </div>
                {authData.role === 'vendor' && (
                  <input 
                    type="text" placeholder="Nombre de tu comercio" value={authData.businessName} 
                    onChange={e => setAuthData({...authData, businessName: e.target.value})}
                    className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900 placeholder:text-slate-400"
                  />
                )}
              </>
            )}
            <input 
              type="email" placeholder="Email" value={authData.email}
              onChange={e => setAuthData({...authData, email: e.target.value})}
              className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900 placeholder:text-slate-400"
            />
            <input 
              type="password" placeholder="Contraseña" value={authData.password}
              onChange={e => setAuthData({...authData, password: e.target.value})}
              className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 font-bold text-slate-900 placeholder:text-slate-400"
            />
            <button 
              disabled={loading}
              onClick={handleAuth} 
              className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black shadow-2xl shadow-blue-200 hover:scale-[1.02] active:scale-95 transition-all text-xl italic tracking-tighter"
            >
              {loading ? '...' : isRegistering ? 'REGISTRAR' : 'INGRESAR'}
            </button>
            <div className="text-center">
              <button onClick={() => setIsRegistering(!isRegistering)} className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 tracking-widest">
                {isRegistering ? 'Volver al Login' : 'Crear cuenta nueva'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- ADMIN VIEW ---
  if (view === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="p-8 max-w-7xl mx-auto w-full space-y-10 pb-32">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center ring-1 ring-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ingresos Brutos</span>
              <p className="text-4xl font-black text-green-600 italic">${adminStats.totalRev.toLocaleString()}</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center ring-1 ring-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pedidos</span>
              <p className="text-4xl font-black text-blue-600 italic">{adminStats.orderCount}</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center ring-1 ring-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Usuarios</span>
              <p className="text-4xl font-black text-purple-600 italic">{adminStats.userCount}</p>
            </div>
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center ring-1 ring-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Top Categoría</span>
              <p className="text-2xl font-black text-orange-500 italic uppercase">{adminStats.mostPopular}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Usuarios Registrados</h3>
              <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                {registeredUsers.map(u => (
                  <div key={u.uid} className="p-6 flex justify-between items-center hover:bg-slate-50 transition-all">
                    <div>
                      <p className="font-black text-slate-800 uppercase italic">{u.name}</p>
                      <p className="text-[9px] font-bold text-slate-400">{u.email}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>{u.role}</span>
                    </div>
                    <button 
                      onClick={() => {
                        const nP = prompt("Nueva pass para " + u.name);
                        if(nP) setRegisteredUsers(prev => prev.map(usr => usr.uid === u.uid ? {...usr, password: nP} : usr));
                      }}
                      className="text-[9px] font-black uppercase text-blue-500"
                    >Reset Pass</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Sugerencias Sistema AI</h3>
              {adminStats.recs.map((r, i) => (
                <div key={i} className="bg-blue-600 text-white p-6 rounded-[3rem] shadow-xl font-bold italic leading-relaxed">
                  {r}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // --- VENDOR VIEW ---
  if (currentUser?.role === 'vendor' && (view === 'vendor_config' || view === 'dashboard')) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-10 pb-32 animate-in">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl md:text-4xl font-black italic text-slate-800 tracking-tighter uppercase leading-tight">
              Comercio: <span className="text-blue-600">{currentUser?.businessName}</span>
            </h2>
          </div>

          {view === 'vendor_config' ? (
            <div className="space-y-8">
              <div className="bg-white p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-2xl border border-slate-100 space-y-6">
                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter">Añadir Nuevo Producto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <input id="p-name" placeholder="Nombre" className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 border-none" />
                  <input id="p-price" type="number" placeholder="Precio ($)" className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 border-none" />
                  <select id="p-cat" className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100 border-none">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    onClick={() => {
                      const name = (document.getElementById('p-name') as HTMLInputElement).value;
                      const price = (document.getElementById('p-price') as HTMLInputElement).value;
                      const cat = (document.getElementById('p-cat') as HTMLSelectElement).value;
                      if(!name || !price) return showAlert("Datos incompletos", "error");
                      const newP: Product = {
                        id: Math.random().toString(36).substr(2, 5),
                        vendorId: currentUser!.uid,
                        name,
                        price: parseFloat(price),
                        category: cat,
                        emoji: CATEGORIES.find(c => c.id === cat)?.emoji || '📦'
                      };
                      setProducts([...products, newP]);
                      showAlert("Producto cargado", "success");
                    }}
                    className="bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95"
                  >Cargar</button>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Mi Catálogo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {myProducts.map(p => (
                    <div key={p.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-slate-50 flex justify-between items-center transition-all hover:shadow-2xl">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">{p.emoji}</span>
                        <div>
                          <p className="font-black text-slate-800 uppercase italic leading-none">{p.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{p.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-blue-600 italic tracking-tighter">${p.price}</p>
                        <button 
                          onClick={() => {
                            const newPr = prompt("Nuevo precio para " + p.name, p.price.toString());
                            if(newPr) setProducts(prev => prev.map(prod => prod.id === p.id ? {...prod, price: parseFloat(newPr)} : prod));
                          }}
                          className="text-[8px] font-black uppercase text-slate-400 hover:text-blue-600 tracking-widest"
                        >Actualizar</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">Pedidos Activos</h3>
              <div className="grid gap-6">
                {vendorOrders.length === 0 ? (
                  <div className="p-20 bg-white rounded-[3rem] text-center opacity-40 italic font-black text-slate-300">Aún no hay pedidos registrados.</div>
                ) : (
                  vendorOrders.map(o => (
                    <div key={o.id} className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-xl border border-slate-100 flex justify-between items-center animate-in">
                      <div className="flex gap-4 md:gap-6 items-center">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">🍔</div>
                        <div>
                          <h4 className="font-black text-lg md:text-xl italic uppercase text-slate-800 leading-none">{o.item}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Cliente: {o.clientName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === 'delivered' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {o.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- DELIVERY VIEW ---
  if (currentUser?.role === 'delivery') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-8 pb-32">
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center ring-1 ring-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entregas</span>
              <p className="text-4xl md:text-5xl font-black text-slate-800 italic">{partnerDailyCount}</p>
            </div>
            <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col items-center ring-1 ring-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</span>
              <button 
                onClick={() => setIsPartnerOnline(!isPartnerOnline)} 
                className={`mt-1 px-4 md:px-6 py-2 rounded-full text-[9px] md:text-[10px] font-black uppercase border-2 transition-all shadow-sm ${
                  isPartnerOnline 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : 'bg-slate-100 border-slate-300 text-slate-400'
                }`}
              >
                {isPartnerOnline ? 'Conectado' : 'Desconectado'}
              </button>
            </div>
          </div>

          {activeOrderForPartner ? (
            <div className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-2xl border-4 border-blue-600 animate-in space-y-8">
              <div className="flex justify-between items-start">
                <div className="flex gap-4 md:gap-6 items-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-4xl">{activeOrderForPartner.type === 'taxi' ? '🚕' : '📦'}</div>
                  <div>
                    <h4 className="text-xl md:text-2xl font-black text-slate-800 italic uppercase tracking-tighter leading-none">{activeOrderForPartner.item}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Cliente: {activeOrderForPartner.clientName}</p>
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-black text-green-600 italic">{activeOrderForPartner.total}</p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] text-sm italic font-bold text-slate-600 border border-slate-100 shadow-inner">
                📍 {activeOrderForPartner.addressNote}
              </div>
              <div className="grid gap-4">
                {activeOrderForPartner.status === 'accepted' && <button onClick={() => updateOrderStatus(activeOrderForPartner.id, 'at_store')} className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-xl italic uppercase shadow-xl hover:bg-blue-700 transition-all">Estoy en origen</button>}
                {activeOrderForPartner.status === 'at_store' && <button onClick={() => updateOrderStatus(activeOrderForPartner.id, 'on_the_way')} className="w-full bg-orange-500 text-white p-6 rounded-[2rem] font-black text-xl italic uppercase shadow-xl hover:bg-orange-600 transition-all">En camino 🚀</button>}
                {activeOrderForPartner.status === 'on_the_way' && <button onClick={() => updateOrderStatus(activeOrderForPartner.id, 'delivered')} className="w-full bg-green-600 text-white p-6 rounded-[2rem] font-black text-xl italic uppercase shadow-xl hover:bg-green-700 transition-all">Entregado ✅</button>}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-slate-800 italic uppercase tracking-tighter">Pool de servicios</h3>
              {availableOrdersForPartner.length === 0 || !isPartnerOnline ? (
                <div className="p-24 bg-white rounded-[4.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center opacity-40 text-slate-300 font-black italic shadow-inner">
                  {isPartnerOnline ? 'Buscando pedidos cercanos...' : 'Conéctate para ver pedidos'}
                </div>
              ) : (
                <div className="grid gap-6">
                  {availableOrdersForPartner.map(o => (
                    <div key={o.id} className="bg-white p-8 md:p-10 rounded-[3rem] md:rounded-[4rem] shadow-xl border border-slate-50 flex flex-col sm:flex-row items-center gap-6 md:gap-10 hover:shadow-2xl transition-all animate-in ring-1 ring-slate-100">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-[2rem] bg-blue-50 flex items-center justify-center text-4xl">{o.type === 'taxi' ? '🚕' : '📦'}</div>
                      <div className="flex-1 text-center sm:text-left">
                        <h4 className="text-2xl md:text-3xl font-black text-slate-800 italic uppercase leading-none">{o.item}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-2 uppercase italic max-w-xs">{o.addressNote}</p>
                        <span className="text-[10px] font-black text-green-600 uppercase mt-2 block tracking-widest">${o.totalNum} de ganancia</span>
                      </div>
                      <button onClick={() => updateOrderStatus(o.id, 'accepted')} className="w-full sm:w-auto bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl italic uppercase shadow-2xl active:scale-95 transition-all">ACEPTAR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
        <Assistant userContext="Delivery Online." />
      </div>
    );
  }

  // --- CLIENT VIEW ---
  if (currentUser?.role === 'user') {
    if (view === 'category' && selectedCategory) {
      const catProducts = products.filter(p => p.category === selectedCategory.id);
      const isTaxi = selectedCategory.id === 'taxi';
      
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navbar />
          <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-8 animate-in pb-32">
            <button onClick={() => setView('dashboard')} className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 transition-all flex items-center gap-2">← Volver al inicio</button>
            <div className={`p-10 md:p-12 rounded-[4rem] md:rounded-[4.5rem] ${selectedCategory.color} text-white shadow-2xl relative overflow-hidden ring-[10px] md:ring-[12px] ring-white`}>
              <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase leading-tight">{selectedCategory.emoji} {selectedCategory.name}</h2>
              <span className="absolute -right-12 -bottom-12 text-[15rem] md:text-[20rem] opacity-20 rotate-12">{selectedCategory.emoji}</span>
            </div>

            {isTaxi ? (
              <div className="bg-white p-8 md:p-12 rounded-[3.5rem] md:rounded-[4.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 italic tracking-tighter uppercase leading-tight">Pedir un viaje ahora</h3>
                  <p className="text-3xl md:text-4xl font-black text-blue-600 italic tracking-tighter">Tarifa Dinámica</p>
                </div>
                <button 
                  onClick={() => { setCheckoutItem({ name: 'Viaje Taxi', isTaxi: true, price: 0 }); setView('checkout'); }}
                  className="w-full md:w-auto bg-blue-600 text-white px-12 py-8 rounded-[3rem] font-black text-2xl italic tracking-tighter active:scale-95 transition-all uppercase shadow-2xl"
                >Pedir Taxi</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {catProducts.length === 0 ? (
                  <div className="col-span-full p-20 bg-white rounded-[4rem] text-center opacity-40 font-black italic text-slate-300 shadow-inner">Aún no hay productos en esta categoría.</div>
                ) : (
                  catProducts.map(p => (
                    <div key={p.id} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] shadow-xl border border-slate-100 flex justify-between items-center group hover:-translate-y-1 transition-all">
                      <div className="flex items-center gap-4">
                        <span className="text-4xl group-hover:scale-110 transition-transform">{p.emoji}</span>
                        <div>
                          <h4 className="font-black text-lg md:text-xl italic uppercase text-slate-800 leading-none">{p.name}</h4>
                          <p className="text-xl md:text-2xl font-black text-blue-600 italic tracking-tighter mt-1">${p.price}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setCheckoutItem({ name: p.name, isTaxi: false, price: p.price }); setView('checkout'); }}
                        className="bg-blue-600 text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-100 active:scale-90 transition-all hover:bg-blue-700"
                      >+</button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <Assistant userContext={`Usuario en ${selectedCategory.name}.`} />
        </div>
      );
    }

    if (view === 'checkout') {
      return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6 flex flex-col items-center">
          <div className="max-w-md w-full bg-white rounded-[4.5rem] shadow-2xl overflow-hidden animate-in ring-1 ring-slate-200">
            <div className={`p-10 md:p-12 ${checkoutItem.isTaxi ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white'}`}>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-tight">{checkoutItem.isTaxi ? '🚕 Confirmar Viaje' : '🛒 Confirmar Pedido'}</h2>
            </div>
            <div className="p-8 md:p-12 space-y-8 text-slate-900">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-3 ml-4 tracking-[0.2em]">Indicaciones Especiales</label>
                <textarea id="checkout-note" placeholder="¿Hacia dónde vamos o algún detalle para el pedido?" className="w-full p-7 bg-slate-50 rounded-[3rem] font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100 border-none min-h-[160px] resize-none shadow-inner" />
              </div>
              <div className="bg-slate-50 p-8 md:p-10 rounded-[3.5rem] text-center border border-slate-100 shadow-inner">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Total Estimado</span>
                <p className="text-4xl md:text-5xl font-black text-slate-800 italic tracking-tighter">{checkoutItem.isTaxi ? 'Variable' : `$${checkoutItem.price}`}</p>
              </div>
              <button 
                onClick={() => {
                  const note = (document.getElementById('checkout-note') as HTMLTextAreaElement).value;
                  if(!note) return showAlert("Agrega indicaciones para el socio", "error");
                  const newOrder: Order = {
                    id: `ORD-${Math.random().toString(36).toUpperCase().substr(2, 5)}`,
                    clientId: currentUser!.uid,
                    clientName: currentUser!.name,
                    vendorId: products.find(p => p.name === checkoutItem.name)?.vendorId,
                    item: checkoutItem.name,
                    type: checkoutItem.isTaxi ? 'taxi' : 'delivery',
                    status: 'pending',
                    addressNote: note,
                    payment: 'cash',
                    total: checkoutItem.isTaxi ? 'A convenir' : `$${checkoutItem.price}`,
                    totalNum: checkoutItem.price,
                    location: location,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                  };
                  setOrders([newOrder, ...orders]);
                  setView('dashboard');
                  showAlert("Buscando socio cercano...", "success");
                }}
                className={`w-full ${checkoutItem.isTaxi ? 'bg-yellow-500 text-black' : 'bg-blue-600 text-white'} p-8 rounded-[2.5rem] font-black shadow-2xl text-2xl italic tracking-tighter uppercase active:scale-95 transition-all`}
              >Confirmar Ahora</button>
            </div>
          </div>
        </div>
      );
    }

    if (view === 'location_picker') {
      return (
        <div className="h-screen w-full relative">
          <MapComponent center={location} onLocationChange={setLocation} />
          <div className="absolute top-10 left-8 right-8 z-[1000] max-w-lg mx-auto">
            <input 
              onChange={async (e) => {
                const q = e.target.value;
                if(q.length > 3) {
                  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
                  const d = await r.json();
                  setSearchResults(d);
                }
              }}
              placeholder="¿A dónde enviamos tu DOMI?" 
              className="w-full p-6 pl-14 glass rounded-[2.5rem] shadow-2xl outline-none font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 border-none" 
            />
            {searchResults.length > 0 && (
              <div className="mt-4 bg-white/95 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in ring-1 ring-slate-200">
                {searchResults.slice(0, 5).map((s, i) => (
                  <div key={i} onClick={() => { setLocation({lat: parseFloat(s.lat), lng: parseFloat(s.lon), address: s.display_name}); setSearchResults([]); }} className="p-5 border-b border-slate-100 hover:bg-blue-50 cursor-pointer text-[10px] font-black uppercase text-slate-500 transition-colors">
                    {s.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="absolute bottom-12 left-8 right-8 z-[1000] max-w-lg mx-auto">
            <button onClick={() => setView('dashboard')} className="w-full bg-blue-600 text-white p-8 rounded-[3rem] font-black shadow-2xl text-2xl italic tracking-tighter uppercase active:scale-95 transition-all">Establecer Aquí</button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="p-4 md:p-6 max-w-5xl mx-auto w-full space-y-12 animate-in pb-32">
          {activeOrdersForClient.length > 0 && (
            <div className="space-y-6">
              <h3 className="text-3xl font-black text-slate-800 italic tracking-tighter uppercase">Tus pedidos actuales</h3>
              <div className="grid gap-6">
                {activeOrdersForClient.map(o => (
                  <div key={o.id} className="bg-white p-8 md:p-10 rounded-[4.5rem] shadow-2xl border-4 border-blue-600 flex flex-col md:flex-row justify-between items-center ring-1 ring-slate-200 gap-8">
                    <div className="flex gap-8 items-center">
                      <div className="w-16 h-16 md:w-24 md:h-24 rounded-[3rem] flex items-center justify-center text-5xl shadow-inner bg-blue-50 animate-bounce">
                        {o.status === 'on_the_way' ? '🚀' : o.type === 'taxi' ? '🚕' : '📦'}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-2xl md:text-3xl font-black text-slate-800 italic tracking-tighter uppercase leading-none">{o.item}</h4>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full inline-block mt-2">
                          {o.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-700 to-blue-500 p-10 md:p-12 rounded-[5rem] md:rounded-[5.5rem] text-white shadow-2xl relative overflow-hidden ring-[12px] md:ring-[14px] ring-white">
            <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter leading-[0.9] mb-4 uppercase">Explora <br/> tu ciudad <br/> con DOMI</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-80 italic">La super-app que lo hace todo</p>
            <div className="absolute -right-20 -bottom-20 text-[20rem] md:text-[28rem] opacity-10 rotate-12 select-none">🍔</div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => { setSelectedCategory(cat); setView('category'); }} 
                className="bg-white p-8 md:p-12 rounded-[4rem] md:rounded-[5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col items-center text-center ring-1 ring-slate-50"
              >
                <div className="w-20 h-20 md:w-28 md:h-28 bg-slate-50 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-5xl md:text-7xl mb-6 md:mb-8 group-hover:scale-110 group-hover:bg-white transition-all shadow-inner">{cat.emoji}</div>
                <span className="font-black text-xl md:text-3xl text-slate-800 tracking-tight italic uppercase">{cat.name}</span>
              </div>
            ))}
          </div>
        </main>
        <Assistant userContext="Usuario Comprador en Dashboard." />
      </div>
    );
  }

  return null;
};

export default App;
