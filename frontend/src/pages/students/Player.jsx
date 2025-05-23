import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams } from 'react-router-dom';
import { assets } from '../../assets/assets';
import humanizeDuration from 'humanize-duration';
import YouTube from 'react-youtube';
import Footer from '../../component/students/Footer';
import Rating from '../../component/students/Rating';

const Player = () => {
  const [courseData, setCourseData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const { courseId } = useParams();
  const { enrolledCourses, calculateChapterTime } = useContext(AppContext);

  const getCousreData = () => {
    enrolledCourses.map((course) => {
      if (course._id === courseId) {
        setCourseData(course);
      }
    });
  };

  useEffect(() => {
    getCousreData();
  }, [enrolledCourses]);

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <>
      <div className="p-4 sm:p-10 flex flex-col md:grid md:grid-cols-1 lg:grid-cols-2 gap-10 md:px-36">
        {/* Right Column (Top on Mobile) */}
        <div className="md:mt-10 order-1 lg:order-2">
          {playerData ? (
            <div className="">
              <YouTube
                videoId={playerData.lectureUrl.split('/').pop()}
                iframeClassName="w-full aspect-video"
              />
              <div className="flex justify-between items-center mt-1">
                <p>
                  {playerData.chapter}. {playerData.lecture} {playerData.lectureTitle}
                </p>
                <button className="text-blue-600">
                  {false ? 'Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <img src={courseData ? courseData.courseThumbnail : ''} alt="" />
          )}
        </div>

        {/* Left Column (Bottom on Mobile) */}
        <div className="text-gray-800 order-2 lg:order-1">
          <h2 className="text-xl font-semibold">Course Structure</h2>
          <div className="pt-5">
            {courseData &&
              courseData.courseContent.map((chapter, index) => (
                <div key={index} className="border border-gray-300 bg-white mb-2 rounded">
                  <div
                    onClick={() => toggleSection(index)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        className={`transform transition-transform ${
                          openSections[index] ? 'rotate-180' : ''
                        }`}
                        src={assets.down_arrow_icon}
                        alt="arrow icon"
                      />
                      <p className="font-medium md:text-base text-sm">
                        {chapter.chapterTitle}
                      </p>
                    </div>
                    <p className="text-sm md:text-default">
                      {chapter.chapterContent.length} lectures- {calculateChapterTime(chapter)}
                    </p>
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      openSections[index] ? 'max-h-96' : 'max-h-0'
                    }`}
                  >
                    <ul className="list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300">
                      {chapter.chapterContent.map((lecture, i) => (
                        <li key={i} className="flex items-start gap-2 py-1">
                          <img
                            src={false ? assets.blue_tick_icon : assets.play_icon}
                            alt="play icon"
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex items-center justify-between w-full text-gray-800 text-xs md:text-default">
                            <p>{lecture.lectureTitle}</p>
                            <div className="flex gap-2 ">
                              {lecture.lectureUrl && (
                                <p
                                  onClick={() =>
                                    setPlayerData({ ...lecture, chapter: index + 1, lecture: i + 1 })
                                  }
                                  className="text-blue-500 cursor-pointer"
                                >
                                  Watch
                                </p>
                              )}
                              <p>
                                {humanizeDuration(lecture.lectureDuration * 60 * 1000, {
                                  unit: ['h', 'm'],
                                })}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
          </div>
        </div>

        
      </div>

      <div className="flex items-center gap-2 py-3 mt-10 justify-center">
          <h1 className='text-xl font-bold'>Rate this Course :</h1>
          <Rating initialRating={0}/>
        </div>
      <Footer />
    </>
  );
};

export default Player;