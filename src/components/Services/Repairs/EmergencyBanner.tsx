import React from "react";
import { AlertCircle } from "lucide-react";

interface EmergencyBannerProps {
  emergencyServices: string[];
}

const EmergencyBanner: React.FC<EmergencyBannerProps> = ({
  emergencyServices,
}) => {
  return (
    <>
      {/* Emergency Banner */}
      <div className="mb-8 md:mb-16">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <AlertCircle className="mr-4 h-8 w-8 text-red-500" />
              <div>
                <h3 className="heading-3">Emergency Repair Services</h3>
                <p className="text-red-700">
                  Need immediate assistance? We offer 24/7 emergency repair
                  services.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a
                href="tel:(555)123-4567"
                className="rounded-lg bg-red-500 px-6 py-3 text-center font-medium text-white transition-colors duration-200 hover:bg-red-600"
              >
                Call Emergency Line
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Services */}
      <div className="mb-8 md:mb-16">
        <h2 className="section-title mb-8 text-center">
          Emergency & Roadside Services
        </h2>
        <div className="rounded-2xl bg-linear-to-r from-red-500 to-orange-500 p-4 text-white sm:p-8">
          <div className="mb-8 text-center">
            <h3 className="mb-4 text-2xl font-bold">24/7 Emergency Support</h3>
            <p className="text-lg text-red-100">
              Stranded on the road? We&apos;re here to help with immediate
              assistance.
            </p>
          </div>
          <div className="mb-8 grid gap-6 md:grid-cols-3">
            {emergencyServices.map((service, index) => (
              <div key={index} className="text-center">
                <div className="bg-opacity-20 rounded-lg bg-white p-4">
                  <span className="font-medium">{service}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a
              href="tel:(555)123-4567"
              className="inline-flex items-center rounded-lg bg-white px-4 py-3 text-base font-bold text-red-500 transition-colors duration-200 hover:bg-gray-100 sm:px-8 sm:text-lg"
            >
              <AlertCircle className="mr-2" size={24} />
              Emergency: (555) 123-4567
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmergencyBanner;
