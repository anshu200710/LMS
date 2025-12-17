import React from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/students/Home';
import CourseList from './pages/students/CourseList';
import CourseDetails from './pages/students/CourseDetails';
import MyEnrollment from './pages/students/MyEnrollment';
import Player from './pages/students/Player';
import Loading from './component/students/Loading';
import Educator from './pages/educator/Educator';
import Dashboard from './pages/educator/Dashboard';
import AddCourse from './pages/educator/AddCourse';
import StudentEnrollments from './pages/educator/StudentEnrollments';
import Navbar from './component/students/Navbar';
import MyCourses from './pages/educator/MyCourses';
import "quill/dist/quill.snow.css";
import { ToastContainer, toast } from "react-toastify";



const App = () => {
  const location = useLocation();
  const isEducatorPath = location.pathname.startsWith('/educator');

  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer />
      {!isEducatorPath && <Navbar />}

      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/course-list' element={<CourseList />} />
        <Route path='/course-list/:input' element={<CourseList />} />
        <Route path='/course/:id' element={<CourseDetails />} />
        <Route path='/my-enrollments' element={<MyEnrollment />} />
        <Route path='/player/:courseId' element={<Player />} />
        <Route path='/loading/:path' element={<Loading />} />

        <Route path='/educator' element={<Educator />}>
          <Route path='/educator' element={<Dashboard />} />
          <Route path='add-course' element={<AddCourse />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='student-enrolled' element={<StudentEnrollments />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;