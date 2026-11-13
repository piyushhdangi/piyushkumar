import React, { useEffect, useState, useCallback } from 'react';
import { Navbar, type ActivePage } from './components/Navbar';
import { LandingView } from './components/LandingView';
import { ExploreView } from './components/ExploreView';
import { UserDashboardView } from './components/UserDashboardView';
import { ReportItemView } from './components/ReportItemView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AuthModal, type AuthModalTab } from './components/AuthModal';
import { Footer } from './components/Footer';
import { api, type OverviewStatsResponse } from './services/api';
import type { UserRecord, ItemRecord } from './utils/campusLogic';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('landing');
  const [user, setUser] = useState<Omit<UserRecord, 'password_hash'> | null>(null);
  const [requireEduDomain, setRequireEduDomain] = useState(true);
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [overview, setOverview] = useState<OverviewStatsResponse | null>(null);
  const [loadingItems, setLoadingItems] = useState(true);

  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<AuthModalTab>('student-login');
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoadingItems(true);
    try {
      const [meRes, itemsRes, statsRes] = await Promise.all([
        api.getMe(),
        api.getItems(),
        api.getOverviewStats(),
      ]);
      setUser(meRes.user);
      setRequireEduDomain(meRes.settings.requireEduDomain);
      setItems(itemsRes.items);
      setOverview(statsRes);
    } catch (err) {
      console.error('Error refreshing application state:', err);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const showTransientBanner = (msg: string) => {
    setBannerMessage(msg);
    setTimeout(() => {
      setBannerMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const openAuthWithTab = (tab: AuthModalTab) => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  };

  const handleNavigateToReport = (type: 'Lost' | 'Found') => {
    setEditingItem(null);
    if (!user) {
      openAuthWithTab('student-login');
      return;
    }
    setActivePage(type === 'Lost' ? 'report-lost' : 'report-found');
  };

  const handleQuickDemoLogin = async (email: string, pass: string) => {
    try {
      const res = await api.login(email, pass);
      setUser(res.user);
      showTransientBanner(`Signed in as ${res.user.name} (${res.user.role.toUpperCase()}).`);
      await refreshData();
      if (res.user.role === 'admin') {
        setActivePage('admin');
      } else {
        setActivePage('dashboard');
      }
    } catch (err: any) {
      showTransientBanner(err.message || 'Demo login failed.');
    }
  };

  const handleEditItem = (item: ItemRecord) => {
    setEditingItem(item);
    setActivePage(item.item_type === 'Lost' ? 'report-lost' : 'report-found');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar
        activePage={activePage}
        onNavigate={(page) => {
          setEditingItem(null);
          setActivePage(page);
        }}
        user={user}
        onOpenAuthModal={() => openAuthWithTab('student-login')}
      />

      {bannerMessage && (
        <div className="bg-slate-900 text-white text-xs font-medium py-2.5 px-6 text-center">
          {bannerMessage}
        </div>
      )}

      <main className="flex-1">
        {activePage === 'landing' && (
          <LandingView
            items={items}
            overview={overview}
            user={user}
            onReportLost={() => handleNavigateToReport('Lost')}
            onReportFound={() => handleNavigateToReport('Found')}
            onExplore={() => setActivePage('explore')}
            onSelectItem={(id) => setSelectedItemId(id)}
            onQuickDemoLogin={handleQuickDemoLogin}
            onOpenStudentLogin={() => openAuthWithTab('student-login')}
            onOpenAdminLogin={() => openAuthWithTab('admin-login')}
          />
        )}

        {activePage === 'explore' && (
          <ExploreView
            items={items}
            loading={loadingItems}
            onSelectItem={(id) => setSelectedItemId(id)}
            onReportLost={() => handleNavigateToReport('Lost')}
            onReportFound={() => handleNavigateToReport('Found')}
          />
        )}

        {(activePage === 'dashboard' || activePage === 'my-reports') && (
          <UserDashboardView
            mode={activePage}
            user={user}
            items={items}
            overview={overview}
            onOpenAuth={() => openAuthWithTab('student-login')}
            onSelectItem={(id) => setSelectedItemId(id)}
            onEditItem={handleEditItem}
            onReportLost={() => handleNavigateToReport('Lost')}
            onReportFound={() => handleNavigateToReport('Found')}
            onExplore={() => setActivePage('explore')}
            onDataMutated={refreshData}
          />
        )}

        {(activePage === 'report-lost' || activePage === 'report-found') && (
          <ReportItemView
            initialType={activePage === 'report-lost' ? 'Lost' : 'Found'}
            editingItem={editingItem}
            onSuccess={async (savedItem) => {
              setEditingItem(null);
              await refreshData();
              showTransientBanner(
                `Report "${savedItem.title}" saved to the SPSU campus registry.`
              );
              setActivePage('my-reports');
            }}
            onCancel={() => {
              setEditingItem(null);
              setActivePage('dashboard');
            }}
          />
        )}

        {activePage === 'admin' && (
          <AdminDashboardView
            currentUser={user}
            onSelectItem={(id) => setSelectedItemId(id)}
            onDataMutated={refreshData}
            onOpenAdminLogin={() => openAuthWithTab('admin-login')}
          />
        )}
      </main>

      <Footer
        onNavigate={(page) => {
          setEditingItem(null);
          setActivePage(page);
        }}
      />

      <ItemDetailModal
        itemId={selectedItemId}
        onClose={() => setSelectedItemId(null)}
        currentUser={user}
        onOpenAuth={() => openAuthWithTab('student-login')}
        onEditItem={handleEditItem}
        onDataMutated={refreshData}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        initialTab={authModalTab}
        onClose={() => setIsAuthModalOpen(false)}
        user={user}
        requireEduDomain={requireEduDomain}
        onAuthSuccess={async (loggedInUser) => {
          setUser(loggedInUser);
          showTransientBanner(
            `Authenticated as ${loggedInUser.name} (${loggedInUser.role.toUpperCase()}).`
          );
          await refreshData();
          if (loggedInUser.role === 'admin') {
            setActivePage('admin');
          } else if (activePage === 'landing' || activePage === 'admin') {
            setActivePage('dashboard');
          }
        }}
        onLogoutSuccess={async () => {
          setUser(null);
          showTransientBanner('Signed out of your SPSU campus session.');
          if (activePage === 'admin') {
            setActivePage('landing');
          }
          await refreshData();
        }}
      />
    </div>
  );
}
