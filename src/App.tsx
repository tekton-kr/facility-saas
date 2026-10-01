import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell.tsx'
import { ToastHost } from './components/ToastHost.tsx'
import { RequireAuth } from './components/RequireAuth.tsx'
import { SiteGate } from './components/SiteGate.tsx'
import { Bootstrap } from './bootstrap.tsx'
import { AppHome } from './pages/AppHome.tsx'
import { EquipmentPage } from './pages/EquipmentPage.tsx'
import { ForbiddenPage } from './pages/ForbiddenPage.tsx'
import { LobbyPage } from './pages/LobbyPage.tsx'
import { DeskPage, LoginPage } from './pages/LoginPage.tsx'
import { PrivacyPage, TermsPage } from './pages/LegalPage.tsx'
import { PasswordPage } from './pages/PasswordPage.tsx'
import { NotifyPage } from './pages/NotifyPage.tsx'
import { StationPage } from './pages/StationPage.tsx'
import { WorkspacePage } from './pages/WorkspacePage.tsx'
import { PointPage } from './pages/PointPage.tsx'
import { QualityPage } from './pages/QualityPage.tsx'
import { RoleHomeRedirect } from './pages/RoleHomeRedirect.tsx'
import { ScreenIndexPage } from './pages/ScreenIndexPage.tsx'
import { ScreenRedirect } from './pages/ScreenRedirect.tsx'
import { ContractPage } from './pages/ContractPage.tsx'
import { PackagesPage } from './pages/PackagesPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { SystemPage } from './pages/SystemPage.tsx'
import { WorkPage } from './pages/WorkPage.tsx'

export default function App() {
  return (
    <Bootstrap>
      <BrowserRouter>
        <ToastHost />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/password" element={<PasswordPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/desk" element={<DeskPage />} />
          <Route path="/station" element={<StationPage />} />
          <Route path="/w" element={<WorkspacePage />} />
          <Route path="/w/:slug" element={<WorkspacePage />} />
          <Route path="/n/:token" element={<NotifyPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<SiteGate />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<RoleHomeRedirect />} />
              <Route path="/alarms" element={<RoleHomeRedirect />} />
              <Route path="/apps/:app" element={<AppHome />} />
              <Route path="/apps/:app/sites/:siteId" element={<AppHome />} />
              <Route path="/apps/:app/sites/:siteId/systems/:systemId" element={<SystemPage />} />
              <Route
                path="/apps/:app/sites/:siteId/systems/:systemId/equipment/:equipmentId"
                element={<EquipmentPage />}
              />
              <Route
                path="/apps/:app/sites/:siteId/systems/:systemId/equipment/:equipmentId/points/:pointId"
                element={<PointPage />}
              />
              <Route path="/work" element={<WorkPage />} />
              <Route path="/work/:workId" element={<WorkPage />} />
              <Route path="/sites/:siteId/work" element={<WorkPage />} />
              <Route path="/sites/:siteId/contract" element={<ContractPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:packageId" element={<PackagesPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/screens" element={<ScreenIndexPage />} />
              <Route path="/screens/:screenId" element={<ScreenRedirect />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />
              <Route path="*" element={<RoleHomeRedirect />} />
            </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Bootstrap>
  )
}
