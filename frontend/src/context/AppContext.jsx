import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import {useAuth, useUser} from "@clerk/clerk-react"
import axios from 'axios'
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const currency = import.meta.env.VITE_CURRENCY
    const [allCourses, setAllCourses] = useState([])
    const [isEducator, setIsEducator] = useState(true)
    const [enrolledCourses, setEnrolledCourses] = useState([])
    const [userData, setUserData] = useState(null)

    const navigate = useNavigate()

    const {getToken} = useAuth()
    const {user} = useUser()


    // FETCH ALL COURSES
    const fetchAllCourses = async() => {
        try {
            const {data} = await axios.get(backendUrl + '/api/courses/all');

            if (data?.success) {
                setAllCourses(data.courses)
            }else {
               toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    //Fetch user Data
    const fetchUserData = async () => {
  try {
    const token = await getToken()

    const { data } = await axios.get(
      backendUrl + '/api/user/data',
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (data?.success) {
      setUserData(data.user)

      // ✅ SAFE CHECK
      if (data.user?.publicMetadata?.role === 'educator') {
        setIsEducator(true)
      } else {
        setIsEducator(false)
      }
    } else {
      toast.error(data.message)
    }

  } catch (error) {
    toast.error(error.message)
  }
}


    // FUNCTION TO CALCULATE AVERAGE RATING OF COURSE
    const calculateRating = (course) => {
        if (!course.courseRatings || course.courseRatings.length === 0) {
          return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach((rating) => {
          totalRating += rating.rating;
        });
        return Math.floor(totalRating / course.courseRatings.length);
      };

      // function to calculating course chapter time

      const calculateChapterTime = (chapter) => {

        let time = 0 ;
        chapter.chapterContent.map((lecture) => time += lecture.lectureDuration)
        return humanizeDuration(time * 60 * 1000 , {units: ['h', 'm']})

      }

      // function to calculating course Duration

      const calculateCourseDuration = (course)=> {
        let time = 0;

        course.courseContent.map((chapter)=> chapter.chapterContent.map(
            (lecture)=>  time += lecture.lectureDuration))

        return humanizeDuration(time * 60 * 1000 , {units: ['h', 'm']})

      }

      // function to calculating No of lectures

    const CalculateNoOfLectures = (course)=> {
        let totalLecture = 0;
        course.courseContent.forEach(chapter => {
            if (Array. isArray(chapter.chapterContent)) {
                totalLecture += chapter. chapterContent.length
            }
        });
        return totalLecture;
    }


    // fetch user enrolled coures
     const fetchUserEnrolledCourses = async () => {
  try {
    const token = await getToken()

    const { data } = await axios.get(
      backendUrl + '/api/user/enrolled-courses',
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    )

    if (data?.success && Array.isArray(data.enrolledCourses)) {
      setEnrolledCourses(data.enrolledCourses.reverse())
    } else {
      // ✅ User not found or no courses
      setEnrolledCourses([])
    }

  } catch (error) {
    console.error(error)
    setEnrolledCourses([])
  }
}




    useEffect(()=> {
        fetchAllCourses()

    },[])


    useEffect(()=> {
        if (user) {
            fetchUserData()
            fetchUserEnrolledCourses()
        }
    },[user])


    const value = {
        currency,allCourses,navigate, calculateRating,
        isEducator, setIsEducator, calculateChapterTime, calculateCourseDuration,
        CalculateNoOfLectures, fetchUserEnrolledCourses, enrolledCourses, backendUrl, userData, setUserData, getToken, fetchAllCourses
        
    }

    return(
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )


    
} 