import React from 'react'
import Navbar from '../components/NavBar'
import Header from '../components/Header'

const Home = () => {
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
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3">📧</span>
                                                <div>
                                                    <p className="font-medium text-gray-900">Email</p>
                                                    <p className="text-gray-600">vhealpointsa@gmail.com</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3">📞</span>
                                                <div>
                                                    <p className="font-medium text-gray-900">Phone</p>
                                                    <p className="text-gray-600">(+84) 834 564 679</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-2xl mr-3">📍</span>
                                                <div>
                                                    <p className="font-medium text-gray-900">Address</p>
                                                    <p className="text-gray-600">123 Healthcare Street, Medical District, City, Country</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Form */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 shadow-lg">
                                        <form className="space-y-4">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="eg. John Doe"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="eg. johndoe@gmail.com"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="message" className="block text-sm font-medium text-gray-700">Message</label>
                                                <textarea
                                                    id="message"
                                                    rows="4"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Your message"
                                                ></textarea>
                                            </div>
                                            <button
                                                type="submit"
                                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                Send Message
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
