
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import { HiStar } from "react-icons/hi";
import {testimonials} from "../../assets/data/testimonials";

const Testimonials = () => {
  return (
    <div className="container">
      <div className="mt-[30px] lg:mt-[100px] pb-0">
        <Swiper
          modules={[Pagination, Autoplay]}
          spaceBetween={30}
          pagination={{ clickable: true }}
          autoplay={{
            delay: 5000,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 1,
              spaceBetween: 0,
            },
            768: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 30,
            },
          }}
        >
          {testimonials.map((item, index) => (
            <SwiperSlide key={index}>
              <div className="py-6 px-5 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-[180px]">
                <div>
                  <div className="flex items-center gap-3">
                    <figure className="h-11 w-11 rounded-full overflow-hidden border border-teal-500/20">
                      <img src={item.photo} alt="" className="w-full h-full object-cover"/>
                    </figure>
                    <div>
                      <h4 className="text-[15px] leading-tight font-bold text-headingColor">
                        {item.name}
                      </h4>
                      <div className="flex mt-1">
                        {[...Array(item.rating)].map((_, i) => (
                          <HiStar key={i} className="text-yellowColor w-4 h-4" />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] leading-relaxed mt-3 text-textColor font-medium italic">
                    "{item.content}"
                  </p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  );
};

export default Testimonials;
