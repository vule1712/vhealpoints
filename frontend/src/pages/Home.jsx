import React, { useContext, useState } from 'react'
import Navbar from '../components/NavBar'
import Header from '../components/Header'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-hot-toast'

const Home = () => {
    const { backendUrl } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const { data } = await axios.post(backendUrl + '/api/contact/submit', formData);
            
            if (data.success) {
                toast.success(data.message);
                setFormData({ name: '', email: '', message: '' });
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='relative min-h-screen'>
            {/* Fixed Background */}
            <div className='fixed inset-0 bg-[url("/bg_img.png")] bg-cover bg-center -z-10' />
            
            {/* Content */}
            <div className='relative'>
                <Navbar />
                <div className="mt-48">
                    <Header />
                    
                    {/* Separator */}
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-16" />
                    
                    {/* About Us Section */}
                    <div className="w-full bg-white/90 backdrop-blur-sm py-16">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                                    About vHealPoints
                                </h2>
                                <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
                                    vHealPoints is a revolutionary healthcare platform that connects patients with qualified doctors, 
                                    making healthcare more accessible and efficient. Our mission is to transform the way people access 
                                    healthcare services through technology.
                                </p>
                            </div>

                            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                {/* Feature 1 */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                                    <div className="text-2xl mb-4">👨‍⚕️</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Find Qualified Doctors</h3>
                                    <p className="text-gray-600">
                                        Connect with verified and experienced doctors across various specialties. 
                                        Read reviews and choose the best healthcare provider for your needs.
                                    </p>
                                </div>

                                {/* Feature 2 */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                                    <div className="text-2xl mb-4">📅</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Appointment Booking</h3>
                                    <p className="text-gray-600">
                                        Book appointments with just a few clicks. View available slots and schedule 
                                        your visit at your convenience.
                                    </p>
                                </div>

                                {/* Feature 3 */}
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                                    <div className="text-2xl mb-4">🔒</div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
                                    <p className="text-gray-600">
                                        Your health information is protected with state-of-the-art security measures. 
                                        We prioritize your privacy and data protection.
                                    </p>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-16" />

                            {/* Additional Info */}
                            <div className="text-center">
                                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                                    Why Choose vHealPoints?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                                    <div className="text-left">
                                        <ul className="space-y-3">
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                Verified Healthcare Professionals
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                24/7 Customer Support
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                Easy-to-use Platform
                                            </li>
                                        </ul>
                                    </div>
                                    <div className="text-left">
                                        <ul className="space-y-3">
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                Real-time Appointment Updates
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                Appointment Reminders
                                            </li>
                                            <li className="flex items-center">
                                                <span className="text-green-500 mr-2">✓</span>
                                                Medical History Tracking
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-16" />

                            {/* Contact Us Section */}
                            <div className="text-center">
                                <h3 className="text-2xl font-semibold text-gray-900 mb-8">
                                    Contact Us
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
                                    {/* Contact Information */}
                                    <div className="text-left space-y-6">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Get in Touch</h4>
                                            <p className="text-gray-600">
                                                Have questions? We're here to help! Reach out to us through any of these channels.
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="flex items-center p-4 bg-white/50 backdrop-blur-sm rounded-lg transition-all duration-300 hover:bg-white/80 hover:shadow-md">
                                                <span className="text-2xl mr-3">📧</span>
                                                <div>
                                                    <p className="font-medium text-gray-900">Email</p>
                                                    <p className="text-gray-600">vhealpointsa@gmail.com</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center p-4 bg-white/50 backdrop-blur-sm rounded-lg transition-all duration-300 hover:bg-white/80 hover:shadow-md">
                                                <span className="text-2xl mr-3">📞</span>
                                                <div>
                                                    <p className="font-medium text-gray-900">Phone</p>
                                                    <p className="text-gray-600">(+84) 834 564 679</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center p-4 bg-white/50 backdrop-blur-sm rounded-lg transition-all duration-300 hover:bg-white/80 hover:shadow-md">
                                                <span className="text-2xl mr-3">📍</span>
                                                <div>
                                                    <p className="font-medium text-gray-900">Address</p>
                                                    <p className="text-gray-600">123 Healthcare Street, Medical District, City, Country</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Form */}
                                    <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg transform transition-all duration-300 hover:shadow-xl">
                                        <form className="space-y-6" onSubmit={handleSubmit}>
                                            <div className="space-y-2">
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                                <div className="relative">
                                                <input
                                                    type="text"
                                                    id="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className="block w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                    placeholder="eg. John Doe"
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                                <div className="relative">
                                                <input
                                                    type="email"
                                                    id="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        className="block w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                    placeholder="eg. johndoe@gmail.com"
                                                        required
                                                    />
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                                <div className="relative">
                                                <textarea
                                                    id="message"
                                                        value={formData.message}
                                                        onChange={handleInputChange}
                                                    rows="4"
                                                        className="block w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                                                    placeholder="Your message"
                                                        required
                                                ></textarea>
                                                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
                                            >
                                                {isSubmitting ? (
                                                    <div className="flex items-center justify-center">
                                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Sending...
                                                    </div>
                                                ) : (
                                                    'Send Message'
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Home
