import React, { useEffect, useState, useContext } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'

const Loading = () => {

  const {path} = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { fetchUserEnrolledCourses, enrolledCourses, userData, backendUrl, getToken } = useContext(AppContext)
  const [attempts, setAttempts] = useState(0)

  // read query param session_id (if present)
  const sessionId = new URLSearchParams(location.search).get('session_id')

  useEffect(()=> {
    let timer
    let pollInterval

    const startPolling = async () => {
      // If we have a sessionId, request the session verification endpoint until enrolled
      if (!sessionId) {
        // fallback: poll enrolled courses
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 1000))
          await fetchUserEnrolledCourses()
          if (enrolledCourses && enrolledCourses.length > 0) {
            navigate(`/${path}`)
            return
          }
        }
        navigate(`/${path}`)
        return
      }

      // If sessionId present: call session status endpoint
      try {
        const token = await getToken()
        for (let i = 0; i < 12; i++) {
          const res = await fetch(`${backendUrl}/api/user/session/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const data = await res.json()
          // if purchase completed and user enrolled, navigate
          if (data?.success && data.purchaseCompleted && data.enrolled) {
            navigate(`/${path}`)
            return
          }
          // small delay
          await new Promise(r => setTimeout(r, 1500))
          setAttempts(i + 1)
        }
      } catch (err) {
        console.error('session poll error', err)
      }

      // fallback navigation
      navigate(`/${path}`)
    }

    if (path) {
      // if sessionId exists we assume we came from Stripe and we should poll
      if (sessionId) startPolling()
      // if no sessionId just wait a short while and navigate
      else {
        timer = setTimeout(() => navigate(`/${path}`), 2000)
      }
    }

    return () => {
      clearTimeout(timer)
      clearInterval(pollInterval)
    }
  },[])
  return (
    <div className='min-h-screen flex items-center justify-center '>
      <div className="w-16 sm:w-20 aspect-square border-4 border-gray-300 border-t-4 border-t-blue-400 rounded-full animate-spin">

      </div>
    </div>
  )
}

export default Loading
