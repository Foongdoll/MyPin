import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom'
import Home from '../../pages/home/Home'
import Login from '../../pages/auth/Login'
import { useSessionStore } from '../../state/session.store'
import Header from '../layout/Header'
import Sidebar from '../layout/Sidebar'

const Layout = () => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  </div>
)

const PublicOnly = () => {
  const { isAuthenticated } = useSessionStore()
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />
}


const ProtectedLayout = () => {
  const { isAuthenticated } = useSessionStore()
  return isAuthenticated ? <Layout /> : <Navigate to="/" replace />
}

/** ----- 라우터 ----- */
const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route index element={<Login />} />          
          <Route path="/login" element={<Login />} />  
          <Route path="/join" element={<Home />} />    
        </Route>
        
        <Route element={<ProtectedLayout />}>
          <Route path="/home" element={<Home />} />          
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default Router
