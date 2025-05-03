import React, { useContext } from 'react'
import { assets } from '../assets/assets'
import { AppContext } from '../context/AppContext'

const Header = () => {

    const { userData } = useContext(AppContext)

    return (
        <div className='flex flex-col items-center mt-20 px-4 text-center text-gray-800'>
            <img src={assets.doctor_char} className='w-36 h-36 rounded-full mb-6' />

            <h1 className='flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2'>
                Hello {userData ? userData.name : 'there'}!
                <img className='w-8 aspect-square' src={assets.hand_wave} />
            </h1>

            <h2 className='text-3xl sm:text-5xl font-semibold mb-4'>
                Welcome to vHealPoints
            </h2>

            <p className='mb-8 max-w-md'>
                vHealPoints is a platform that helps you find doctors and book appointments online.
            </p>

            <button className='border border-gray-500 rounded-full px-8 py-2.5 hover:bg-gray-100 transition-all'>
                Let's get started!
            </button>
        </div>
    )
}

export default Header
