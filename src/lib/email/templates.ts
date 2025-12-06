/**
 * EMAIL TEMPLATES MODULE (523 lines)
 *
 * SUMMARY:
 * This file contains HTML email templates for the car sales application.
 * It generates styled, professional emails for booking confirmations and notifications.
 *
 * MAIN FUNCTIONS:
 * - createServiceBookingConfirmationEmail: Service appointment confirmation emails
 * - createCarViewingConfirmationEmail: Car viewing booking confirmation emails
 * - createCancellationEmail: Booking cancellation notification emails
 *
 * TECHNICAL DEBT ISSUES:
 * - Massive inline HTML templates mixed with TypeScript logic
 * - No template engine used - raw string concatenation
 * - Repetitive styling code duplicated across templates
 * - Hard to maintain and test due to mixed concerns
 * - No email template previewing system
 *
 * REFACTORING NEEDED:
 * - Extract to separate .html template files
 * - Use a proper email template engine (Handlebars, Mustache)
 * - Create shared CSS/styling system
 * - Add email preview functionality
 * - Split into smaller, focused template functions
 */

import { ServiceAppointment, CarViewingBooking } from "@/lib/models";
import { formatDate, formatTime } from "@/lib/utils/booking";

export function createServiceBookingConfirmationEmail(
  booking: ServiceAppointment,
  shopInfo: {
    businessName: string;
    phone: string;
    email: string;
    address: string;
  }
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Service Booking Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Service Booking Confirmed!</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">Thank you for choosing ${
                shopInfo.businessName
              }</p>
            </td>
          </tr>
          
          <!-- Booking Reference -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #6c757d; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
                <p style="margin: 8px 0 0; color: #212529; font-size: 24px; font-weight: bold;">${
                  booking.bookingReference
                }</p>
                <p style="margin: 8px 0 0; color: #6c757d; font-size: 13px;">Please keep this reference number for your records</p>
              </div>
            </td>
          </tr>
          
          <!-- Booking Details -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 20px; color: #212529; font-size: 20px; font-weight: 600;">Appointment Details</h2>
              
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Service Type:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${
                      booking.serviceType
                    }</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Date:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${formatDate(
                      booking.appointmentDate
                    )}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Time:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${formatTime(
                      booking.appointmentTime
                    )}</span>
                  </td>
                </tr>
                ${
                  booking.serviceDetails
                    ? `
                <tr>
                  <td colspan="2" style="padding: 12px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Additional Details:</span><br/>
                    <span style="color: #212529; font-size: 14px; margin-top: 4px; display: block;">${booking.serviceDetails}</span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>
          
          <!-- Customer Info -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h2 style="margin: 0 0 20px; color: #212529; font-size: 20px; font-weight: 600;">Your Information</h2>
              
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Name:</span>
                    <span style="color: #212529; font-size: 14px; margin-left: 8px; font-weight: 600;">${
                      booking.customerInfo.name
                    }</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Email:</span>
                    <span style="color: #212529; font-size: 14px; margin-left: 8px; font-weight: 600;">${
                      booking.customerInfo.email
                    }</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Phone:</span>
                    <span style="color: #212529; font-size: 14px; margin-left: 8px; font-weight: 600;">${
                      booking.customerInfo.phone
                    }</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${
                process.env.NEXT_PUBLIC_SITE_URL
              }/bookings/lookup?ref=${booking.bookingReference}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                View Your Booking
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e9ecef;">
              <h3 style="margin: 0 0 15px; color: #212529; font-size: 18px; font-weight: 600;">${
                shopInfo.businessName
              }</h3>
              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                📍 ${shopInfo.address}<br/>
                📞 ${shopInfo.phone}<br/>
                ✉️ ${shopInfo.email}
              </p>
              <p style="margin: 20px 0 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
                If you need to cancel or reschedule, please contact us at least 24 hours in advance.<br/>
                This is an automated confirmation email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function createCarViewingBookingConfirmationEmail(
  booking: CarViewingBooking,
  shopInfo: {
    businessName: string;
    phone: string;
    email: string;
    address: string;
  }
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="format-detection" content="telephone=no">
  <meta name="format-detection" content="date=no">
  <meta name="format-detection" content="address=no">
  <meta name="format-detection" content="email=no">
  <title>Car Viewing Booking Confirmation</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; line-height: 1.6;">
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your car viewing appointment has been confirmed. Booking reference: ${
      booking.bookingReference
    }
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa;">
    <tr>
      <td style="padding: 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">✅ Booking Confirmed!</h1>
              <p style="margin: 12px 0 0; color: #e0e7ff; font-size: 16px; font-weight: 400;">Your car viewing appointment is scheduled</p>
            </td>
          </tr>
          
          <!-- Booking Reference -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <div style="background-color: #f8f9fa; border-left: 4px solid #f5576c; padding: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #6c757d; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
                <p style="margin: 8px 0 0; color: #212529; font-size: 24px; font-weight: bold;">${
                  booking.bookingReference
                }</p>
                <p style="margin: 8px 0 0; color: #6c757d; font-size: 13px;">Please keep this reference number for your records</p>
              </div>
            </td>
          </tr>
          
          <!-- Vehicle Details -->
          <tr>
            <td style="padding: 0 30px 20px;">
              <h2 style="margin: 0 0 20px; color: #212529; font-size: 20px; font-weight: 600;">Vehicle Details</h2>
              
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                ${
                  booking.carDetails.image
                    ? `
                <img src="${booking.carDetails.image}" alt="Vehicle" style="width: 100%; height: auto; border-radius: 6px; margin-bottom: 15px;"/>
                `
                    : ""
                }
                <h3 style="margin: 0 0 10px; color: #212529; font-size: 22px; font-weight: bold;">
                  ${booking.carDetails.year} ${booking.carDetails.make} ${
                    booking.carDetails.model
                  }
                </h3>
                <p style="margin: 0; color: #28a745; font-size: 20px; font-weight: bold;">$${booking.carDetails.price.toLocaleString()}</p>
              </div>
              
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Date:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${formatDate(
                      booking.appointmentDate
                    )}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Time:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${formatTime(
                      booking.appointmentTime
                    )}</span>
                  </td>
                </tr>
                ${
                  booking.dealership
                    ? `
                <tr>
                  <td colspan="2" style="padding: 12px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Location:</span><br/>
                    <span style="color: #212529; font-size: 14px; margin-top: 4px; display: block; font-weight: 600;">${booking.dealership.location}</span>
                    <span style="color: #6c757d; font-size: 13px; display: block;">${booking.dealership.address}</span>
                  </td>
                </tr>
                `
                    : ""
                }
              </table>
            </td>
          </tr>
          
          <!-- Customer Info -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h2 style="margin: 0 0 20px; color: #212529; font-size: 20px; font-weight: 600;">Your Information</h2>
              
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Name:</span>
                    <span style="color: #212529; font-size: 14px; margin-left: 8px; font-weight: 600;">${
                      booking.customerInfo.name
                    }</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Email:</span>
                    <span style="color: #212529; font-size: 14px; margin-left: 8px; font-weight: 600;">${
                      booking.customerInfo.email
                    }</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="color: #6c757d; font-size: 14px;">Phone:</span>
                    <span style="color: #212529; font-size: 14px; margin-left: 8px; font-weight: 600;">${
                      booking.customerInfo.phone
                    }</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <a href="${
                process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
              }/Booking/lookup?ref=${booking.bookingReference}" 
                 style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                View Your Booking
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e9ecef;">
              <h3 style="margin: 0 0 15px; color: #212529; font-size: 18px; font-weight: 600;">${
                shopInfo.businessName
              }</h3>
              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                📍 ${shopInfo.address}<br/>
                📞 ${shopInfo.phone}<br/>
                ✉️ ${shopInfo.email}
              </p>
              <p style="margin: 20px 0 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
                Please arrive 5-10 minutes early for your appointment. Bring a valid driver's license if you'd like to test drive.<br/>
                This is an automated confirmation email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function createBookingCancellationEmail(
  booking: ServiceAppointment | CarViewingBooking,
  bookingType: "service" | "viewing",
  shopInfo: {
    businessName: string;
    phone: string;
    email: string;
    address: string;
  }
): string {
  const isViewing = bookingType === "viewing";
  const viewingBooking = booking as CarViewingBooking;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Cancellation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #dc3545; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Booking Cancelled</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">We're sorry to inform you of this cancellation</p>
            </td>
          </tr>
          
          <!-- Booking Reference -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <div style="background-color: #f8f9fa; border-left: 4px solid #dc3545; padding: 20px; border-radius: 4px;">
                <p style="margin: 0; color: #6c757d; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Booking Reference</p>
                <p style="margin: 8px 0 0; color: #212529; font-size: 24px; font-weight: bold;">${
                  booking.bookingReference
                }</p>
              </div>
            </td>
          </tr>
          
          <!-- Cancellation Reason -->
          ${
            booking.cancellationReason
              ? `
          <tr>
            <td style="padding: 0 30px 20px;">
              <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 20px;">
                <h3 style="margin: 0 0 10px; color: #856404; font-size: 16px; font-weight: 600;">Reason for Cancellation:</h3>
                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.6;">${booking.cancellationReason}</p>
              </div>
            </td>
          </tr>
          `
              : ""
          }
          
          <!-- Original Booking Details -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <h2 style="margin: 0 0 20px; color: #212529; font-size: 20px; font-weight: 600;">Original Booking Details</h2>
              
              ${
                isViewing
                  ? `
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                <h3 style="margin: 0 0 5px; color: #212529; font-size: 18px; font-weight: bold;">
                  ${viewingBooking.carDetails.year} ${
                    viewingBooking.carDetails.make
                  } ${viewingBooking.carDetails.model}
                </h3>
                <p style="margin: 0; color: #28a745; font-size: 16px; font-weight: bold;">$${viewingBooking.carDetails.price.toLocaleString()}</p>
              </div>
              `
                  : ""
              }
              
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${
                  !isViewing
                    ? `
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Service Type:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${
                      (booking as ServiceAppointment).serviceType
                    }</span>
                  </td>
                </tr>
                `
                    : ""
                }
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Date:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${formatDate(
                      booking.appointmentDate
                    )}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef;">
                    <span style="color: #6c757d; font-size: 14px;">Time:</span>
                  </td>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e9ecef; text-align: right;">
                    <span style="color: #212529; font-size: 14px; font-weight: 600;">${formatTime(
                      booking.appointmentTime
                    )}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px; text-align: center;">
              <p style="margin: 0 0 20px; color: #6c757d; font-size: 15px;">We'd love to help you reschedule or book a new appointment</p>
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}" 
                 style="display: inline-block; background-color: #28a745; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600;">
                Book Another Appointment
              </a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; border-top: 1px solid #e9ecef;">
              <h3 style="margin: 0 0 15px; color: #212529; font-size: 18px; font-weight: 600;">${
                shopInfo.businessName
              }</h3>
              <p style="margin: 0; color: #6c757d; font-size: 14px; line-height: 1.6;">
                📍 ${shopInfo.address}<br/>
                📞 ${shopInfo.phone}<br/>
                ✉️ ${shopInfo.email}
              </p>
              <p style="margin: 20px 0 0; color: #6c757d; font-size: 12px; line-height: 1.5;">
                If you have any questions about this cancellation, please don't hesitate to contact us.<br/>
                This is an automated notification email. Please do not reply to this message.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
