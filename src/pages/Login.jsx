import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Mock login since we don't have a backend
            // In a real app: const response = await api.post('/auth/login', formData);

            // Simulating API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock success response
            const mockToken = btoa(JSON.stringify({
                id: 1,
                email: formData.email,
                name: formData.email.split('@')[0],
                role: formData.email === 'admin@publiceye.com' ? 'admin' :
                    formData.email === 'dept@publiceye.com' ? 'department' :
                        formData.email === 'senior@publiceye.com' ? 'senior_authority' : 'user'
            }));
            const mockTokenString = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${mockToken}.mocksignature`;

            const userData = {
                id: 1,
                email: formData.email,
                name: formData.email.split('@')[0],
                role: formData.email === 'admin@publiceye.com' ? 'admin' :
                    formData.email === 'dept@publiceye.com' ? 'department' :
                        formData.email === 'senior@publiceye.com' ? 'senior_authority' : 'user'
            };

            login(mockTokenString, userData);
            toast.success('Logged in successfully!');
            navigate('/dashboard');
        } catch (error) {
            toast.error('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 overflow-hidden bg-transparent">
            {/* Background Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
            <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
            <div className="absolute bottom-[-10%] left-[20%] w-96 h-96 bg-pink-400/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
            <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
                <Link to="/" className="flex items-center gap-2 text-blue-600 font-bold text-xl hover:text-blue-700 transition-colors">
                    <Home size={28} />
                    <span>Public-Eye</span>
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Or{' '}
                    <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
                        create a new account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
                <div className="glass-card py-8 px-4 sm:px-10 animate-slide-up">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-4 py-3 bg-white/50 border border-white/40 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white sm:text-sm transition-all duration-300"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="appearance-none block w-full px-4 py-3 bg-white/50 border border-white/40 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white sm:text-sm pr-10 transition-all duration-300"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-blue-500/25 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Signing in...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <LogIn size={18} />
                                        Sign in
                                    </span>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 border-t border-gray-100 pt-6">
                        <p className="text-xs text-center text-gray-500">
                            Mock logins: <br />
                            <span className="font-semibold text-gray-700">admin@publiceye.com</span> (Admin)<br />
                            <span className="font-semibold text-gray-700">dept@publiceye.com</span> (Department)<br />
                            <span className="font-semibold text-gray-700">senior@publiceye.com</span> (Senior Authority)
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
