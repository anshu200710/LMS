import React from 'react'
import Hero from '../../component/students/Hero'
import Companys from '../../component/students/Companys'
import CoursesSection from '../../component/students/CoursesSection'
import Testimonals from '../../component/students/Testimonals'
import CallToAction from '../../component/students/CallToAction'
import Footer from '../../component/students/Footer'

const Home = () => {
  return (
    <div className='flex flex-col items-center space-y-7 text-center'>
      <Hero/>
      <Companys/>
      <CoursesSection/>
      <Testimonals/>
      <CallToAction/>
      <Footer/>
    </div>
  )
}

export default Home
