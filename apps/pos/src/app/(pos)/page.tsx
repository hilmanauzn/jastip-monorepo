'use client';

import { useState, useEffect } from 'react';
import { useMe, useLogout, useMenus, useRestaurants, useCreateOrder, usePreviewOrder } from '@jastip/api-client';
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle, Badge } from '@jastip/ui';
import { formatCurrency, cn } from '@jastip/ui';
import { LogOut, Plus, Minus, Trash2, Building2, X, ShoppingCart, CreditCard, Menu } from 'lucide-react';

interface CartItem {
  menuItemId: string;
  name: string;
  description: string;
  price: number;
  basePrice: number;
  quantity: number;
  category: string;
  includeJastip: boolean;
  jastipFeeSpecial?: number;
  selectedAddon?: string;
  isManual: boolean;
}

export default function POSPage() {
  const { data: user } = useMe();
  const { mutate: logout } = useLogout();
  const { data: menus, isLoading: menusLoading } = useMenus({ isAvailable: true, limit: 100 });
  const { data: restaurants } = useRestaurants({ isActive: true, limit: 20 });
  const createOrder = useCreateOrder();
  const previewOrder = usePreviewOrder();

  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [ongkir, setOngkir] = useState(0);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<any>(null);

  // Filter menus by selected restaurant
  const filteredMenus = menus?.data.filter((m: any) => 
    !selectedRestaurant || m.restaurantId === selectedRestaurant
  ) || [];

  // Group menus by category
  const categories = [...new Set(filteredMenus.map((m: any) => m.category))];

  // Update preview when cart changes
  useEffect(() => {
    if (cart.length > 0) {
      previewOrder.mutate(
        { items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          description: item.description,
          price: item.price,
          basePrice: item.basePrice,
          quantity: item.quantity,
          category: item.category,
          includeJastip: item.includeJastip,
          jastipFeeSpecial: item.jastipFeeSpecial,
          selectedAddon: item.selectedAddon,
          isManual: item.isManual,
        })), ongkir, destination },
        { onSuccess: (data) => setPreview(data.data) }
      );
    } else {
      setPreview(null);
    }
  }, [cart, ongkir, destination]);

  const handleAddToCart = (menu: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItemId === menu.id);
      if (existing) {
        return prev.map(item =>
          item.menuItemId === menu.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, {
        menuItemId: menu.id,
        name: menu.name,
        description: menu.description,
        price: menu.price,
        basePrice: menu.price,
        quantity: 1,
        category: menu.category,
        includeJastip: menu.includeJastip,
        jastipFeeSpecial: menu.jastipFeeSpecial,
        isManual: false,
      }];
    });
  };

  const handleQuantityChange = (menuItemId: string, delta: number) => {
    setCart(prev => prev
      .map(item => item.menuItemId === menuItemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item)
      .filter(item => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (menuItemId: string) => {
    setCart(prev => prev.filter(item => item.menuItemId !== menuItemId));
  };

  const handleCreateOrder = () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Nama pelanggan wajib diisi');
      return;
    }

    createOrder.mutate(
      {
        customerName,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          name: item.name,
          description: item.description,
          price: item.price,
          basePrice: item.basePrice,
          quantity: item.quantity,
          category: item.category,
          includeJastip: item.includeJastip,
          jastipFeeSpecial: item.jastipFeeSpecial,
          selectedAddon: item.selectedAddon,
          isManual: item.isManual,
        })),
        ongkir,
        destination,
        notes,
      },
      {
        onSuccess: () => {
          setCart([]);
          setCustomerName('');
          setCustomerPhone('');
          setOngkir(0);
          setDestination('');
          setNotes('');
          setPreview(null);
          alert('Pesanan berhasil dibuat!');
        },
        onError: (err: any) => {
          alert(err?.response?.data?.error || 'Gagal membuat pesanan');
        },
      }
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col hidden lg:flex">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">Jastip POS</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{user?.tenantSlug}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-3 py-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Restoran</label>
            <Select
              value={selectedRestaurant}
              onValueChange={setSelectedRestaurant}
              options={[
                { value: '', label: 'Semua Restoran' },
                ...(restaurants?.data.map((r: any) => ({ value: r.id, label: r.name })) || []),
              ]}
              placeholder="Pilih restoran"
            />
          </div>

          <div className="pt-4 border-t">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Keranjang ({totalItems})
            </h3>
            {cart.length === 0 ? (
              <p className="px-3 text-sm text-gray-500 text-center py-4">Keranjang kosong</p>
            ) : (
              <div className="px-3 space-y-2 max-h-64 overflow-y-auto">
                {cart.map(item => (
                  <div key={item.menuItemId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(item.price)} x {item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleQuantityChange(item.menuItemId, -1)} className="p-1 text-gray-500 hover:text-gray-700"><Minus className="h-4 w-4" /></button>
                      <span className="text-sm w-6 text-center">{item.quantity}</span>
                      <button onClick={() => handleQuantityChange(item.menuItemId, 1)} className="p-1 text-gray-500 hover:text-gray-700"><Plus className="h-4 w-4" /></button>
                      <button onClick={() => handleRemoveFromCart(item.menuItemId)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t">
          <button onClick={() => logout()} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Buat Pesanan Baru</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.name}</span>
              <Badge variant={user?.role === 'SUPER_ADMIN' ? 'default' : 'secondary'}>{user?.role}</Badge>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Panel */}
            <div className="lg:col-span-2 space-y-6">
              {categories.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    {selectedRestaurant ? 'Tidak ada menu tersedia untuk restoran ini' : 'Pilih restoran untuk melihat menu'}
                  </CardContent>
                </Card>
              ) : (
                categories.map(category => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3">
                        {filteredMenus
                          .filter((m: any) => m.category === category)
                          .map((menu: any) => (
                            <button
                              key={menu.id}
                              onClick={() => handleAddToCart(menu)}
                              className={cn(
                                'p-3 text-left rounded-lg border border-gray-200 hover:border-primary/50 hover:bg-primary/5 transition-colors group',
                                !menu.isAvailable && 'opacity-50 cursor-not-allowed'
                              )}
                              disabled={!menu.isAvailable}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 group-hover:text-primary">{menu.name}</p>
                                  {menu.description && (
                                    <p className="text-xs text-gray-500 line-clamp-1">{menu.description}</p>
                                  )}
                                </div>
                                {menu.jastipFeeSpecial && (
                                  <Badge variant="secondary" className="text-xs">Fee: {formatCurrency(menu.jastipFeeSpecial)}</Badge>
                                )}
                              </div>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-900">{formatCurrency(menu.price)}</span>
                                <Plus className="h-5 w-5 text-primary/50 group-hover:text-primary transition-colors" />
                              </div>
                            </button>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Order Summary Panel */}
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Detail Pesanan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Nama Pelanggan *</label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama pelanggan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Telepon</label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Ongkir</label>
                    <Input
                      type="number"
                      value={ongkir}
                      onChange={(e) => setOngkir(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Tujuan</label>
                    <Input
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Alamat pengiriman"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Catatan</label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan tambahan"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({totalItems} item)</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {preview && (
                    <>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Jastip Fee</span>
                        <span>{formatCurrency(preview.jastipFeeTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Pajak Service</span>
                        <span>{formatCurrency(preview.taxServiceTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Pajak Charge</span>
                        <span>{formatCurrency(preview.taxChargeTotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Ongkir</span>
                        <span>{formatCurrency(preview.ongkir)}</span>
                      </div>
                      <div className="border-t pt-3 flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(preview.grandTotal)}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Button
                onClick={handleCreateOrder}
                disabled={cart.length === 0 || !customerName.trim() || createOrder.isPending}
                className="w-full"
                size="lg"
              >
                {createOrder.isPending ? (
                  <>
                    <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Bayar {preview ? formatCurrency(preview.grandTotal) : 'Sekarang'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}