import React from 'react';
import { AlignLeft, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ toggleSidebar }) => {
    const { user } = useAuth();

    return (
        <header className="glass-panel h-16 flex items-center justify-between px-4 sticky top-0 z-10 mt-0 lg:mt-0 transition-all duration-300">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="md:hidden text-gray-500 hover:text-gray-700 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <AlignLeft size={24} />
                </button>
                <h1 className="text-xl font-semibold text-gray-800 truncate md:hidden">Public-Eye</h1>
                <div className="hidden md:block">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 bg-gray-100/50 border border-transparent rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white w-64 transition-all duration-300"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <button className="text-gray-500 hover:text-blue-600 relative p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                </button>

                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900">{user?.name || 'User'}</span>
                        <span className="text-xs text-gray-500 capitalize">{user?.role || 'Citizen'}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-500 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 ring-2 ring-white cursor-pointer hover:scale-105 transition-transform">
                        {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
