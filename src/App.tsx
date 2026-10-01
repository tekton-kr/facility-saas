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
import { GuidePage } from './pages/GuidePage.tsx'
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
import { AssetsPage } from './pages/AssetsPage.tsx'
import { DiagnosePage } from './pages/DiagnosePage.tsx'
import { InspectionsPage, CyclesPage, PhotosPage, DrawingsPage, SchedulePage } from './pages/MaintainPages.tsx'
import { MetersPage } from './pages/MetersPage.tsx'
import { CalendarPage, RosterPage } from './pages/DiaryPages.tsx'
import { PackagesPage } from './pages/PackagesPage.tsx'
import { PendingDomainPage } from './pages/PendingDomainPage.tsx'
import { SettingsPage } from './pages/SettingsPage.tsx'
import { ProfilePage } from './pages/ProfilePage.tsx'
import { SystemPage } from './pages/SystemPage.tsx'
import { ReportPage } from './pages/ReportPage.tsx'
import { StaffPage } from './pages/StaffPage.tsx'
import { WorkPage } from './pages/WorkPage.tsx'

export default function App() {
  return (
    <Bootstrap>
      <BrowserRouter>
        <ToastHost />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/password" element={<PasswordPage />} />
          <Route path="/guide" element={<GuidePage />} />
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
              <Route path="/inspections" element={<InspectionsPage />} />
              <Route path="/sites/:siteId/inspections" element={<InspectionsPage />} />
              <Route path="/assets" element={<AssetsPage />} />
              <Route path="/sites/:siteId/assets" element={<AssetsPage />} />
              <Route path="/diagnosis" element={<DiagnosePage />} />
              <Route path="/sites/:siteId/diagnosis" element={<DiagnosePage />} />
              <Route path="/cycles" element={<CyclesPage />} />
              <Route path="/sites/:siteId/cycles" element={<CyclesPage />} />
              <Route path="/photos" element={<PhotosPage />} />
              <Route path="/sites/:siteId/photos" element={<PhotosPage />} />
              <Route path="/drawings" element={<DrawingsPage />} />
              <Route path="/sites/:siteId/drawings" element={<DrawingsPage />} />
              <Route path="/schedule" element={<SchedulePage />} />
              <Route path="/sites/:siteId/schedule" element={<SchedulePage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/sites/:siteId/calendar" element={<CalendarPage />} />
              <Route path="/roster" element={<RosterPage />} />
              <Route path="/sites/:siteId/roster" element={<RosterPage />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="/sites/:siteId/staff" element={<StaffPage />} />
              <Route path="/meters" element={<MetersPage />} />
              <Route path="/sites/:siteId/meters" element={<MetersPage />} />
              <Route path="/domains/:domain" element={<PendingDomainPage />} />
              <Route path="/sites/:siteId/domains/:domain" element={<PendingDomainPage />} />
              <Route path="/contract" element={<ContractPage />} />
              <Route path="/work" element={<WorkPage />} />
              <Route path="/work/:workId" element={<WorkPage />} />
              <Route path="/sites/:siteId/work" element={<WorkPage />} />
              <Route path="/sites/:siteId/contract" element={<ContractPage />} />
              <Route path="/packages" element={<PackagesPage />} />
              <Route path="/packages/:packageId" element={<PackagesPage />} />
              <Route path="/reports" element={<ReportPage />} />
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
