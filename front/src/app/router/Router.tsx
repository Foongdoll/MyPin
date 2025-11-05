import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Home from '../../pages/home/Home';
import Login from '../../pages/auth/Login';

const Common = () => {
    return (
        <Outlet />
    )
}

const Protected = () => {



    return (
        <Outlet />
    )
}

const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Common />}>
                    <Route index path='/' element={<Home />} />
                    <Route index path='/join' element={<Home />} />
                    <Route index path='/login' element={<Login />} />
                </Route>
                <Route element={<Protected />}>

                </Route>
            </Routes>
        </BrowserRouter>
    )
}

export default Router;