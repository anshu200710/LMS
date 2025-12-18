import React, { useContext, useEffect, useRef, useState } from 'react'
import uniqid from 'uniqid'
import Quill from 'quill'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddCourse = () => {


  const quillref =  useRef(null)
  const editorref =  useRef(null)
  const {backendUrl, getToken} = useContext(AppContext)

  const [courseTitle, setCourseTitle] = useState('')
  const [coursePrice, setCoursePrice] = useState(0)
  const [discount, setDiscount] = useState(0)
  const [image, setImage] = useState(null)
  const [chapters, setChapters] = useState([])
  const [showPopup, setShowPopup] = useState(false)
  const [currentChapterId, setCurrentChapterId] = useState(null)
  const [lectureDetails, setLectureDetails] = useState(
    {
      lectureTitle : "",
      lectureDuration : "",
      lectureUrl : "",
      isPreviewFree : "false"
    }
  )


  const handleChapter = (action, chapterId) => {
    if (action === 'add') {
      const title = prompt('Enter Chapter Name :');
      if (title) {
        const newChapter = {
          chapterId: uniqid(),
          chapterTitle: title,
          chapterContent: [],
          collapsed: false,
          chapterOrder : chapters.length > 0 ? chapters.slice(-1)[0].chapterOrder + 1 : 1
        };
        setChapters([...chapters, newChapter])
      }
    }else if (action === 'remove') {
      setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId))
    }else if (action === 'toggle') {
      setChapters(
        chapters.map((chapter) => 
        chapter.chapterId === chapterId ? { ...chapter, collapsed: !chapter.collapsed } : chapter
      )
    )
    }
  }


  const handleLecture = (action, chapterId, lectureIndex) => {
    if (action === 'add') {
      setCurrentChapterId(chapterId);
      setShowPopup(true)
    }else if (action === 'remove') {
      setChapters(
        chapters.map((chapter)=> {
          if (chapter.chapterId === chapterId) {
            chapter.chapterContent.splice(lectureIndex, 1)
          }
          return chapter;
        })
      )
    }
  }





  const addLecture = () => {
    setChapters(
      chapters.map((chapter) => {
        if (chapter.chapterId === currentChapterId) {
          const newLecture = {
            ...lectureDetails,
            lectureOrder: chapter.chapterContent.length > 0 ? chapter.chapterContent.slice(-1)[0].lectureOrder + 1 : 1, lectureId: uniqid()
          };
          chapter.chapterContent.push(newLecture)
        }
        return chapter;
      })
    );
    setShowPopup(false)
    setLectureDetails({
      lectureTitle : "",
      lectureDuration : "",
      lectureUrl : "",
      isPreviewFree : "false"
    })
  }


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
    
      if(!image){
        toast.error("thumbnail not selected !")
      }

      const courseData = {
        courseTitle,
        courseDescription: quillref.current.root.innerHTML,
        coursePrice: Number(coursePrice),
        discount: Number(discount),
        courseContent: chapters,
      }

      const  formData = new FormData()
      formData.append('courseData', JSON.stringify(courseData))
      formData.append('image', image)


      const token = await getToken()

      const {data} = await axios.post(backendUrl + '/api/educator/add-course', formData, {headers: {Authorization: `Bearer ${token}`}})


      if (data.success) {
        toast.success(data.message)
        setCourseTitle('')
        setCoursePrice(0)
        setDiscount(0)
        setImage(null)
        setChapters([])
        quillref.current.root.innerHTML = ""
      }else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }



  useEffect(()=> {
    // initiate quill only once
    if (!quillref.current && editorref.current) {
       quillref.current = new Quill(editorref.current, {
      theme: "snow"
  },[]);

    }
  })



  return (
    <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
       <form onSubmit={handleSubmit} action="" className="flex flex-col gap-4 max-w-md w-full text-gray-500">

        <div className="flex flex-col gap-1">
          <p>Course Title</p>
          <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle} type="text" placeholder="Type here" className="outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500" required ></input>
        </div>

        <div className="flex flex-col gap-1">
          <p>Course Description</p>
          <div ref={editorref}></div>
        </div>


        <div className="flex items-center justify-between flex-wrap">

          <div className="flex flex-col gap-1">
            <p>Course Price</p>
          <input onChange={e => setCoursePrice(e.target.value)}  value="0" type="number" placeholder="0" className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500" required />
          </div>

          <div className="flex md:flex-row flex-col items-center gap-3">
          <p>Course Thumbnail</p>
          <label for="thumbnailImage" className="flex items-center gap-3">
            <img src={assets.file_upload_icon} alt="" className="p-3 bg-blue-500 rounded" />
             <input type="file" id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept='image/*' hidden  />
             <img className='max-h-10' src={image ? URL.createObjectURL(image) : ""} alt="" />
          </label>
          </div>

          <div className="flex flex-col gap-1 mt-4">
            <p>Discount %</p>
          <input onChange={e => setDiscount(e.target.value)}  value="0" type="number" placeholder="0" className="outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500" required />
          </div>
             
             {/* Adding Chapters & Lectures */}

          <div>
            {chapters.map((chapter, chapterIndex)=> (
              <div className="bg-white border rounded-lg mb-4 " key={chapterIndex}>

                <div className="flex gap-3 justify-between items-center p-4 border-b">
                  
                  <div className="flex gap-3 pr-3 items-center ">
                    <img onClick={()=> handleLecture('toggle', chapter.chapterId)} src={assets.dropdown_icon} width={14} alt="" className={`mr-3 cursor-pointer transition-all ${chapter.collapsed && "-rotate-90"}`} />
                    <span className='mr-3 font-semibold '> {chapterIndex + 1}   {chapter.chapterTitle}</span>
                  </div>
                  <span className='text-gray-500 '>{chapter.chapterContent.length} Lectures</span>
                  <img onClick={()=> handleLecture('remove', chapter.chapterId , lectureIndex)} className='cursor-pointer px-3' src={assets.cross_icon} alt="" />
                </div>

                {!chapter.collapsed && (
                  <div  className="p-4">
                    {chapter.chapterContent.map((lecture, lectureIndex)=> (
                      <div className="flex justify-start gap-5 m-3 items-center bg-blue-100 p-2 rounded-lg cursor-pointer" key={lectureIndex}>
                      <span className="mr-2">
                        {lectureIndex + 1}. {lecture.lectureTitle} - {lecture.lectureDuration} mins -&nbsp; {/* Add non-breaking space here */}
                        <a href={lecture.lectureUrl} target="_blank" className="text-blue-500">
                          Link
                        </a>
                        &nbsp;-&nbsp; {/* Add non-breaking space here */}
                        {lecture.isPreviewFree ? 'Free Previw' : 'paid'}
                      </span>
                      <img
                        onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)}
                        className="cursor-pointer"
                        src={assets.cross_icon}
                        alt=""
                      />
                    </div>
                    ))}

                    <div onClick={()=> handleLecture('add', chapter.chapterId)} className="inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2">
                      + Add Lecture
                    </div>


                  </div>
                )}
              </div>
            ))}

            <div onClick={()=> handleChapter('add')} className="flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer">+ Add Chapter</div> </div>



            {showPopup && (
              <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
                <div className="bg-white  text-gray-700 p-4 rounded relative w-full max-w-80">
                  <h2 className='font-bold'>Add Lecture</h2>
                  <br />

                  <div className="mb-2">
                    <p>Lecture Title</p>

                    <input
                     type="text" 
                     className='mt-1 block w-full border rounded py-1 px-2'
                     value={lectureDetails.lectureTitle}
                     onChange={(e)=> setLectureDetails({...lectureDetails, lectureTitle: e.target.value})}
                     />
                  </div>


                  <div className="mb-2">
                    <p>Duration (minutes)</p>

                    <input
                     type="number" 
                     className='mt-1 block w-full border rounded py-1 px-2'
                     value={lectureDetails.lectureDuration}
                     onChange={(e)=> setLectureDetails({...lectureDetails, lectureDuration: e.target.value})}
                     />
                  </div>

                  <div className="mb-2">
                    <p>Lecture Url</p>

                    <input
                     type="text" 
                     className='mt-1 block w-full border rounded py-1 px-2'
                     value={lectureDetails.lectureUrl}
                     onChange={(e)=> setLectureDetails({...lectureDetails, lectureUrl: e.target.value})}
                     />
                  </div>

                  <div className="mb-2">
                    <p>Is Preview Free ?</p>

                    <input
                     type="checkbox" 
                     className='mt-1 block w-full border rounded py-1 px-2'
                     value={lectureDetails.isPreviewFree}
                     onChange={(e)=> setLectureDetails({...lectureDetails, isPreviewFree: e.target.value})}
                     />
                  </div>

                  <button onClick={()=> addLecture()} type='button' className='w-full bg-blue-400 text-white px-4 py-2 rounded'>Add</button>


                  <img onClick={() => setShowPopup(false)}  src={assets.cross_icon} className='absolute top-4 right-4 w-4 cursor-pointer' alt="" />


                </div>
              </div>
            )}
        </div>

        <button type="submit" className="bg-black text-white w-max py-2.5 px-8 rounded my-4">ADD</button>

       </form>
    </div>
  )
}

export default AddCourse
