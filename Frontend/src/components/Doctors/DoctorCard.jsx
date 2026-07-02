/* eslint-disable react/prop-types */

import starIcon from "../../assets/images/Star.png";
import { Link } from "react-router-dom";
import { BsArrowRightCircle } from "react-icons/bs";

const DoctorCard = ({ doctor }) => {
  return (
    <div className="p-4 lg:p-5 bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full">
      <div>
        <div className="h-[250px] w-full rounded-xl overflow-hidden mb-4 bg-gray-50">
          <img 
            src={doctor.photo || "https://res.cloudinary.com/default-avatar.png"} 
            className="w-full h-full object-cover object-top" 
            alt={doctor.name} 
          />
        </div>
        
        <h2 className="text-[18px] leading-[30px] lg:text-[21px] lg:leading-8 text-headingColor font-[700] mt-2">
          {doctor.name}
        </h2>
        
        <div className="flex items-center justify-between mt-3">
          <span className="bg-[#CCF0F3] text-irisBlueColor py-1 px-2.5 text-[12px] leading-4 rounded font-[600]">
            {doctor.specialization}
          </span>
          <div className="flex items-center gap-[6px]">
            <span className="flex items-center gap-[4px] text-[14px] font-[600] text-headingColor">
              <img src={starIcon} alt="starIcon" className="w-4 h-4 object-contain" />
              {doctor.averageRating}
            </span>
            <span className="text-[13px] font-[400] text-textColor">
              ({doctor.totalRating})
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center mt-5 pt-3 border-t border-dashed border-gray-150">
        <p className="text-[13px] font-[500] text-textColor truncate max-w-[70%]">
          {doctor.experiences && doctor.experiences.length > 0 
            ? `At ${doctor.experiences[doctor.experiences.length - 1].hospital}`
            : "General Practitioner"
          }
        </p>
        <Link 
          to={`/doctors/${doctor._id}`}
          className="text-headingColor hover:text-primaryColor transition-all">
          <BsArrowRightCircle className="w-8 h-8" />
        </Link>
      </div>
    </div>
  );
};

export default DoctorCard;
