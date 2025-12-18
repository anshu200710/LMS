import React, { useEffect, useState, useContext } from 'react'
import { AppContext } from '../../context/AppContext'

import Loading from "../../component/students/Loading";
import { dummyStudentEnrolled } from "../../assets/assets";

const StudentEnrollments = () => {
  const [enrolledStudents, setEnrolledStudents] = useState(null);
    const { getToken, backendUrl, isEducator} = useContext(AppContext)
  

  const fetchEnrolledStudents = async() => {
    try {
      const token = await getToken()

      const {data} = await axios.get(backendUrl + '/api/educator/enrolled-students', {headers: {Authorization: `Bearer ${token}`}})

      data.success && setEnrolledStudents(data.enrolledStudents.reverse())
    } catch (error) {
       toast.error(error.message)
    }
  };

    useEffect(()=> {
      if(!isEducator){
            fetchEnrolledStudents();
      }
    },[isEducator])
  // Fixed dependency array

  return enrolledStudents ? (
    <div className="min-h-screen flex flex-col items-start justify-between md:p-8 md:pb-0 pt-8 pb-0">
      <div className="w-full">
        <h2 className="pb-4 text-lg font-medium">Enrolled Students</h2>

        <div className="flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20">
          <table className="md:table-auto w-full overflow-hidden">
            <thead className="text-gray-900 border border-b border-gray-500/20 text-sm text-left">
              <tr>
                <th className="px-4 py-3 font-semibold text-center hidden sm:table-cell">
                  #
                </th>
                <th className="px-4 py-3 font-semibold truncate">Student Name</th>
                <th className="px-4 py-3 font-semibold truncate">Course Title</th>
                <th className="px-4 py-3 font-semibold truncate">Date</th>
              </tr>
            </thead>

            <tbody className="text-sm text-gray-500">
              {enrolledStudents.map((item, index) => (
                <tr key={index} className="border border-b border-gray-500/20">
                  <td className="px-4 py-3 font-semibold text-center hidden sm:table-cell">
                    {index + 1}
                  </td>

                  <td className="md:px-4 pl-2 md:pl-4 py-3 flex text-center space-x-3 truncate">
                    <img
                      src={item.student.imageUrl}
                      alt="courseThumbnail"
                      className="w-9 h-9 rounded-full"
                    />
                    <span className="truncate hidden md:block">
                      {item.student.name}
                    </span>
                  </td>

                  <td className="px-4 py-3">{item.courseTitle}</td>
                  <td className="px-4 py-3">
                    {new Date(item.purchaseDate).toLocaleDateString()} {/* Fixed this line */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : (
    <Loading />
  );
};

export default StudentEnrollments;
