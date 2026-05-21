"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useUser, useSession } from "@clerk/nextjs";
import { ArrowRight, LogOut } from "lucide-react";
import { FACULTIES } from "@/lib/constants";
import { completeOnboarding } from "./_actions";

const COUNTRY_CODES = [
    { code: 'AF', dial: '+93',   flag: '🇦🇫', name: 'Afghanistan' },
    { code: 'AL', dial: '+355',  flag: '🇦🇱', name: 'Albania' },
    { code: 'DZ', dial: '+213',  flag: '🇩🇿', name: 'Algeria' },
    { code: 'AD', dial: '+376',  flag: '🇦🇩', name: 'Andorra' },
    { code: 'AO', dial: '+244',  flag: '🇦🇴', name: 'Angola' },
    { code: 'AG', dial: '+1268', flag: '🇦🇬', name: 'Antigua & Barbuda' },
    { code: 'AR', dial: '+54',   flag: '🇦🇷', name: 'Argentina' },
    { code: 'AM', dial: '+374',  flag: '🇦🇲', name: 'Armenia' },
    { code: 'AU', dial: '+61',   flag: '🇦🇺', name: 'Australia' },
    { code: 'AT', dial: '+43',   flag: '🇦🇹', name: 'Austria' },
    { code: 'AZ', dial: '+994',  flag: '🇦🇿', name: 'Azerbaijan' },
    { code: 'BS', dial: '+1242', flag: '🇧🇸', name: 'Bahamas' },
    { code: 'BH', dial: '+973',  flag: '🇧🇭', name: 'Bahrain' },
    { code: 'BD', dial: '+880',  flag: '🇧🇩', name: 'Bangladesh' },
    { code: 'BB', dial: '+1246', flag: '🇧🇧', name: 'Barbados' },
    { code: 'BY', dial: '+375',  flag: '🇧🇾', name: 'Belarus' },
    { code: 'BE', dial: '+32',   flag: '🇧🇪', name: 'Belgium' },
    { code: 'BZ', dial: '+501',  flag: '🇧🇿', name: 'Belize' },
    { code: 'BJ', dial: '+229',  flag: '🇧🇯', name: 'Benin' },
    { code: 'BT', dial: '+975',  flag: '🇧🇹', name: 'Bhutan' },
    { code: 'BO', dial: '+591',  flag: '🇧🇴', name: 'Bolivia' },
    { code: 'BA', dial: '+387',  flag: '🇧🇦', name: 'Bosnia & Herzegovina' },
    { code: 'BW', dial: '+267',  flag: '🇧🇼', name: 'Botswana' },
    { code: 'BR', dial: '+55',   flag: '🇧🇷', name: 'Brazil' },
    { code: 'BN', dial: '+673',  flag: '🇧🇳', name: 'Brunei' },
    { code: 'BG', dial: '+359',  flag: '🇧🇬', name: 'Bulgaria' },
    { code: 'BF', dial: '+226',  flag: '🇧🇫', name: 'Burkina Faso' },
    { code: 'BI', dial: '+257',  flag: '🇧🇮', name: 'Burundi' },
    { code: 'CV', dial: '+238',  flag: '🇨🇻', name: 'Cabo Verde' },
    { code: 'KH', dial: '+855',  flag: '🇰🇭', name: 'Cambodia' },
    { code: 'CM', dial: '+237',  flag: '🇨🇲', name: 'Cameroon' },
    { code: 'CA', dial: '+1',    flag: '🇨🇦', name: 'Canada' },
    { code: 'CF', dial: '+236',  flag: '🇨🇫', name: 'Central African Republic' },
    { code: 'TD', dial: '+235',  flag: '🇹🇩', name: 'Chad' },
    { code: 'CL', dial: '+56',   flag: '🇨🇱', name: 'Chile' },
    { code: 'CN', dial: '+86',   flag: '🇨🇳', name: 'China' },
    { code: 'CO', dial: '+57',   flag: '🇨🇴', name: 'Colombia' },
    { code: 'KM', dial: '+269',  flag: '🇰🇲', name: 'Comoros' },
    { code: 'CG', dial: '+242',  flag: '🇨🇬', name: 'Congo' },
    { code: 'CD', dial: '+243',  flag: '🇨🇩', name: 'Congo (DRC)' },
    { code: 'CR', dial: '+506',  flag: '🇨🇷', name: 'Costa Rica' },
    { code: 'HR', dial: '+385',  flag: '🇭🇷', name: 'Croatia' },
    { code: 'CU', dial: '+53',   flag: '🇨🇺', name: 'Cuba' },
    { code: 'CY', dial: '+357',  flag: '🇨🇾', name: 'Cyprus' },
    { code: 'CZ', dial: '+420',  flag: '🇨🇿', name: 'Czech Republic' },
    { code: 'CI', dial: '+225',  flag: '🇨🇮', name: "Côte d'Ivoire" },
    { code: 'DK', dial: '+45',   flag: '🇩🇰', name: 'Denmark' },
    { code: 'DJ', dial: '+253',  flag: '🇩🇯', name: 'Djibouti' },
    { code: 'DM', dial: '+1767', flag: '🇩🇲', name: 'Dominica' },
    { code: 'DO', dial: '+1809', flag: '🇩🇴', name: 'Dominican Republic' },
    { code: 'EC', dial: '+593',  flag: '🇪🇨', name: 'Ecuador' },
    { code: 'EG', dial: '+20',   flag: '🇪🇬', name: 'Egypt' },
    { code: 'SV', dial: '+503',  flag: '🇸🇻', name: 'El Salvador' },
    { code: 'GQ', dial: '+240',  flag: '🇬🇶', name: 'Equatorial Guinea' },
    { code: 'ER', dial: '+291',  flag: '🇪🇷', name: 'Eritrea' },
    { code: 'EE', dial: '+372',  flag: '🇪🇪', name: 'Estonia' },
    { code: 'SZ', dial: '+268',  flag: '🇸🇿', name: 'Eswatini' },
    { code: 'ET', dial: '+251',  flag: '🇪🇹', name: 'Ethiopia' },
    { code: 'FJ', dial: '+679',  flag: '🇫🇯', name: 'Fiji' },
    { code: 'FI', dial: '+358',  flag: '🇫🇮', name: 'Finland' },
    { code: 'FR', dial: '+33',   flag: '🇫🇷', name: 'France' },
    { code: 'GA', dial: '+241',  flag: '🇬🇦', name: 'Gabon' },
    { code: 'GM', dial: '+220',  flag: '🇬🇲', name: 'Gambia' },
    { code: 'GE', dial: '+995',  flag: '🇬🇪', name: 'Georgia' },
    { code: 'DE', dial: '+49',   flag: '🇩🇪', name: 'Germany' },
    { code: 'GH', dial: '+233',  flag: '🇬🇭', name: 'Ghana' },
    { code: 'GR', dial: '+30',   flag: '🇬🇷', name: 'Greece' },
    { code: 'GD', dial: '+1473', flag: '🇬🇩', name: 'Grenada' },
    { code: 'GT', dial: '+502',  flag: '🇬🇹', name: 'Guatemala' },
    { code: 'GN', dial: '+224',  flag: '🇬🇳', name: 'Guinea' },
    { code: 'GW', dial: '+245',  flag: '🇬🇼', name: 'Guinea-Bissau' },
    { code: 'GY', dial: '+592',  flag: '🇬🇾', name: 'Guyana' },
    { code: 'HT', dial: '+509',  flag: '🇭🇹', name: 'Haiti' },
    { code: 'HN', dial: '+504',  flag: '🇭🇳', name: 'Honduras' },
    { code: 'HU', dial: '+36',   flag: '🇭🇺', name: 'Hungary' },
    { code: 'IS', dial: '+354',  flag: '🇮🇸', name: 'Iceland' },
    { code: 'IN', dial: '+91',   flag: '🇮🇳', name: 'India' },
    { code: 'ID', dial: '+62',   flag: '🇮🇩', name: 'Indonesia' },
    { code: 'IR', dial: '+98',   flag: '🇮🇷', name: 'Iran' },
    { code: 'IQ', dial: '+964',  flag: '🇮🇶', name: 'Iraq' },
    { code: 'IE', dial: '+353',  flag: '🇮🇪', name: 'Ireland' },
    { code: 'IL', dial: '+972',  flag: '🇮🇱', name: 'Israel' },
    { code: 'IT', dial: '+39',   flag: '🇮🇹', name: 'Italy' },
    { code: 'JM', dial: '+1876', flag: '🇯🇲', name: 'Jamaica' },
    { code: 'JP', dial: '+81',   flag: '🇯🇵', name: 'Japan' },
    { code: 'JO', dial: '+962',  flag: '🇯🇴', name: 'Jordan' },
    { code: 'KZ', dial: '+7',    flag: '🇰🇿', name: 'Kazakhstan' },
    { code: 'KE', dial: '+254',  flag: '🇰🇪', name: 'Kenya' },
    { code: 'KI', dial: '+686',  flag: '🇰🇮', name: 'Kiribati' },
    { code: 'KP', dial: '+850',  flag: '🇰🇵', name: 'Korea (North)' },
    { code: 'KR', dial: '+82',   flag: '🇰🇷', name: 'Korea (South)' },
    { code: 'KW', dial: '+965',  flag: '🇰🇼', name: 'Kuwait' },
    { code: 'KG', dial: '+996',  flag: '🇰🇬', name: 'Kyrgyzstan' },
    { code: 'LA', dial: '+856',  flag: '🇱🇦', name: 'Laos' },
    { code: 'LV', dial: '+371',  flag: '🇱🇻', name: 'Latvia' },
    { code: 'LB', dial: '+961',  flag: '🇱🇧', name: 'Lebanon' },
    { code: 'LS', dial: '+266',  flag: '🇱🇸', name: 'Lesotho' },
    { code: 'LR', dial: '+231',  flag: '🇱🇷', name: 'Liberia' },
    { code: 'LY', dial: '+218',  flag: '🇱🇾', name: 'Libya' },
    { code: 'LI', dial: '+423',  flag: '🇱🇮', name: 'Liechtenstein' },
    { code: 'LT', dial: '+370',  flag: '🇱🇹', name: 'Lithuania' },
    { code: 'LU', dial: '+352',  flag: '🇱🇺', name: 'Luxembourg' },
    { code: 'MG', dial: '+261',  flag: '🇲🇬', name: 'Madagascar' },
    { code: 'MW', dial: '+265',  flag: '🇲🇼', name: 'Malawi' },
    { code: 'MY', dial: '+60',   flag: '🇲🇾', name: 'Malaysia' },
    { code: 'MV', dial: '+960',  flag: '🇲🇻', name: 'Maldives' },
    { code: 'ML', dial: '+223',  flag: '🇲🇱', name: 'Mali' },
    { code: 'MT', dial: '+356',  flag: '🇲🇹', name: 'Malta' },
    { code: 'MH', dial: '+692',  flag: '🇲🇭', name: 'Marshall Islands' },
    { code: 'MR', dial: '+222',  flag: '🇲🇷', name: 'Mauritania' },
    { code: 'MU', dial: '+230',  flag: '🇲🇺', name: 'Mauritius' },
    { code: 'MX', dial: '+52',   flag: '🇲🇽', name: 'Mexico' },
    { code: 'FM', dial: '+691',  flag: '🇫🇲', name: 'Micronesia' },
    { code: 'MD', dial: '+373',  flag: '🇲🇩', name: 'Moldova' },
    { code: 'MC', dial: '+377',  flag: '🇲🇨', name: 'Monaco' },
    { code: 'MN', dial: '+976',  flag: '🇲🇳', name: 'Mongolia' },
    { code: 'ME', dial: '+382',  flag: '🇲🇪', name: 'Montenegro' },
    { code: 'MA', dial: '+212',  flag: '🇲🇦', name: 'Morocco' },
    { code: 'MZ', dial: '+258',  flag: '🇲🇿', name: 'Mozambique' },
    { code: 'MM', dial: '+95',   flag: '🇲🇲', name: 'Myanmar' },
    { code: 'NA', dial: '+264',  flag: '🇳🇦', name: 'Namibia' },
    { code: 'NR', dial: '+674',  flag: '🇳🇷', name: 'Nauru' },
    { code: 'NP', dial: '+977',  flag: '🇳🇵', name: 'Nepal' },
    { code: 'NL', dial: '+31',   flag: '🇳🇱', name: 'Netherlands' },
    { code: 'NZ', dial: '+64',   flag: '🇳🇿', name: 'New Zealand' },
    { code: 'NI', dial: '+505',  flag: '🇳🇮', name: 'Nicaragua' },
    { code: 'NE', dial: '+227',  flag: '🇳🇪', name: 'Niger' },
    { code: 'NG', dial: '+234',  flag: '🇳🇬', name: 'Nigeria' },
    { code: 'MK', dial: '+389',  flag: '🇲🇰', name: 'North Macedonia' },
    { code: 'NO', dial: '+47',   flag: '🇳🇴', name: 'Norway' },
    { code: 'OM', dial: '+968',  flag: '🇴🇲', name: 'Oman' },
    { code: 'PK', dial: '+92',   flag: '🇵🇰', name: 'Pakistan' },
    { code: 'PW', dial: '+680',  flag: '🇵🇼', name: 'Palau' },
    { code: 'PA', dial: '+507',  flag: '🇵🇦', name: 'Panama' },
    { code: 'PG', dial: '+675',  flag: '🇵🇬', name: 'Papua New Guinea' },
    { code: 'PY', dial: '+595',  flag: '🇵🇾', name: 'Paraguay' },
    { code: 'PE', dial: '+51',   flag: '🇵🇪', name: 'Peru' },
    { code: 'PH', dial: '+63',   flag: '🇵🇭', name: 'Philippines' },
    { code: 'PL', dial: '+48',   flag: '🇵🇱', name: 'Poland' },
    { code: 'PT', dial: '+351',  flag: '🇵🇹', name: 'Portugal' },
    { code: 'QA', dial: '+974',  flag: '🇶🇦', name: 'Qatar' },
    { code: 'RO', dial: '+40',   flag: '🇷🇴', name: 'Romania' },
    { code: 'RU', dial: '+7',    flag: '🇷🇺', name: 'Russia' },
    { code: 'RW', dial: '+250',  flag: '🇷🇼', name: 'Rwanda' },
    { code: 'KN', dial: '+1869', flag: '🇰🇳', name: 'Saint Kitts & Nevis' },
    { code: 'LC', dial: '+1758', flag: '🇱🇨', name: 'Saint Lucia' },
    { code: 'VC', dial: '+1784', flag: '🇻🇨', name: 'Saint Vincent & Grenadines' },
    { code: 'WS', dial: '+685',  flag: '🇼🇸', name: 'Samoa' },
    { code: 'SM', dial: '+378',  flag: '🇸🇲', name: 'San Marino' },
    { code: 'ST', dial: '+239',  flag: '🇸🇹', name: 'São Tomé & Príncipe' },
    { code: 'SA', dial: '+966',  flag: '🇸🇦', name: 'Saudi Arabia' },
    { code: 'SN', dial: '+221',  flag: '🇸🇳', name: 'Senegal' },
    { code: 'RS', dial: '+381',  flag: '🇷🇸', name: 'Serbia' },
    { code: 'SC', dial: '+248',  flag: '🇸🇨', name: 'Seychelles' },
    { code: 'SL', dial: '+232',  flag: '🇸🇱', name: 'Sierra Leone' },
    { code: 'SG', dial: '+65',   flag: '🇸🇬', name: 'Singapore' },
    { code: 'SK', dial: '+421',  flag: '🇸🇰', name: 'Slovakia' },
    { code: 'SI', dial: '+386',  flag: '🇸🇮', name: 'Slovenia' },
    { code: 'SB', dial: '+677',  flag: '🇸🇧', name: 'Solomon Islands' },
    { code: 'SO', dial: '+252',  flag: '🇸🇴', name: 'Somalia' },
    { code: 'ZA', dial: '+27',   flag: '🇿🇦', name: 'South Africa' },
    { code: 'SS', dial: '+211',  flag: '🇸🇸', name: 'South Sudan' },
    { code: 'ES', dial: '+34',   flag: '🇪🇸', name: 'Spain' },
    { code: 'LK', dial: '+94',   flag: '🇱🇰', name: 'Sri Lanka' },
    { code: 'SD', dial: '+249',  flag: '🇸🇩', name: 'Sudan' },
    { code: 'SR', dial: '+597',  flag: '🇸🇷', name: 'Suriname' },
    { code: 'SE', dial: '+46',   flag: '🇸🇪', name: 'Sweden' },
    { code: 'CH', dial: '+41',   flag: '🇨🇭', name: 'Switzerland' },
    { code: 'SY', dial: '+963',  flag: '🇸🇾', name: 'Syria' },
    { code: 'TW', dial: '+886',  flag: '🇹🇼', name: 'Taiwan' },
    { code: 'TJ', dial: '+992',  flag: '🇹🇯', name: 'Tajikistan' },
    { code: 'TZ', dial: '+255',  flag: '🇹🇿', name: 'Tanzania' },
    { code: 'TH', dial: '+66',   flag: '🇹🇭', name: 'Thailand' },
    { code: 'TL', dial: '+670',  flag: '🇹🇱', name: 'Timor-Leste' },
    { code: 'TG', dial: '+228',  flag: '🇹🇬', name: 'Togo' },
    { code: 'TO', dial: '+676',  flag: '🇹🇴', name: 'Tonga' },
    { code: 'TT', dial: '+1868', flag: '🇹🇹', name: 'Trinidad & Tobago' },
    { code: 'TN', dial: '+216',  flag: '🇹🇳', name: 'Tunisia' },
    { code: 'TR', dial: '+90',   flag: '🇹🇷', name: 'Turkey' },
    { code: 'TM', dial: '+993',  flag: '🇹🇲', name: 'Turkmenistan' },
    { code: 'TV', dial: '+688',  flag: '🇹🇻', name: 'Tuvalu' },
    { code: 'UG', dial: '+256',  flag: '🇺🇬', name: 'Uganda' },
    { code: 'UA', dial: '+380',  flag: '🇺🇦', name: 'Ukraine' },
    { code: 'AE', dial: '+971',  flag: '🇦🇪', name: 'United Arab Emirates' },
    { code: 'GB', dial: '+44',   flag: '🇬🇧', name: 'United Kingdom' },
    { code: 'US', dial: '+1',    flag: '🇺🇸', name: 'United States' },
    { code: 'UY', dial: '+598',  flag: '🇺🇾', name: 'Uruguay' },
    { code: 'UZ', dial: '+998',  flag: '🇺🇿', name: 'Uzbekistan' },
    { code: 'VU', dial: '+678',  flag: '🇻🇺', name: 'Vanuatu' },
    { code: 'VE', dial: '+58',   flag: '🇻🇪', name: 'Venezuela' },
    { code: 'VN', dial: '+84',   flag: '🇻🇳', name: 'Vietnam' },
    { code: 'YE', dial: '+967',  flag: '🇾🇪', name: 'Yemen' },
    { code: 'ZM', dial: '+260',  flag: '🇿🇲', name: 'Zambia' },
    { code: 'ZW', dial: '+263',  flag: '🇿🇼', name: 'Zimbabwe' },
];


export default function OnboardingPage() {
    const router = useRouter();
    const { refreshProfile, signOut } = useAuth();
    const { user } = useUser();
    const { session } = useSession();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Profile Data
    const [faculty, setFaculty] = useState("");
    const [programme, setProgramme] = useState("");
    const [level, setLevel] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");
    const [dialCode, setDialCode] = useState("+233"); // Default Ghana

    // OTP States
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [otpError, setOtpError] = useState("");
    
    // Timer State
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
        if (!isOtpSent || isOtpVerified) return;

        setTimeLeft(600); // Reset on each new OTP send
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setOtpError("OTP expired. Please request a new one.");
                    setIsOtpSent(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isOtpSent, isOtpVerified]); // ← no timeLeft dep; countdown managed inside callback

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    useEffect(() => {
        const checkUser = async () => {
            try {
                if (!user) {
                    setLoading(false);
                    return;
                }

                // Fetch existing profile if they have one (in case they refresh)
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("faculty, programme, level, whatsapp_number")
                    .eq("id", user.id)
                    .single();

                if (profile) {
                    if (profile.faculty) setFaculty(profile.faculty);
                    if (profile.programme) setProgramme(profile.programme);
                    if (profile.level) setLevel(profile.level);
                    if (profile.whatsapp_number) {
                        setWhatsappNumber(profile.whatsapp_number);
                        setIsOtpVerified(true);
                    }
                }
            } catch (err) {
                console.error("Error checking user:", err);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [user]);

    const handleSendOtp = async () => {
        if (!whatsappNumber.trim()) {
            setOtpError("Please enter a WhatsApp number first.");
            return;
        }
        // Strip leading 0 from local number before prepending dial code
        const localNumber = whatsappNumber.trim().replace(/^0+/, '');
        const fullNumber = dialCode + localNumber;
        setOtpLoading(true);
        setOtpError("");
        try {
            const res = await fetch("/api/whatsapp/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: fullNumber }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to send OTP");
            setIsOtpSent(true);
            setTimeLeft(600);
        } catch (err: any) {
            setOtpError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp.trim()) {
            setOtpError("Please enter the OTP.");
            return;
        }
        const localNumber = whatsappNumber.trim().replace(/^0+/, '');
        const fullNumber = dialCode + localNumber;
        setOtpLoading(true);
        setOtpError("");
        try {
            const res = await fetch("/api/whatsapp/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phoneNumber: fullNumber, otp }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to verify OTP");
            setIsOtpVerified(true);
            setOtpError("");
        } catch (err: any) {
            setOtpError(err.message);
        } finally {
            setOtpLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!faculty.trim() || !programme.trim() || !level.trim() || !whatsappNumber.trim()) {
            setError("Please fill out all fields to continue.");
            return;
        }

        if (!isOtpVerified) {
            setError("Please verify your WhatsApp number to continue.");
            return;
        }

        if (!user) {
            setError("Not signed in.");
            return;
        }

        setSubmitting(true);
        setError("");

        // Compose the verified full international number
        const fullWhatsapp = dialCode + whatsappNumber.trim().replace(/^0+/, '');

        try {
            // Mark onboarding as complete in Clerk's publicMetadata and upsert Supabase profile
            const formData = new FormData();
            formData.set('faculty', faculty.trim());
            formData.set('programme', programme.trim());
            formData.set('level', level.trim());
            formData.set('whatsappNumber', fullWhatsapp);
            const res = await completeOnboarding(formData);

            if (res?.error) {
                setError(res.error);
                setSubmitting(false);
                return;
            }

            try {
                // Forces a token refresh so middleware sees onboardingComplete
                await user.reload();
                await session?.getToken({ skipCache: true });
            } catch (tokenErr) {
                console.warn("[onboarding] Non-fatal error refreshing Clerk token:", tokenErr);
            }

            // Refresh the global profile state
            await refreshProfile();

            // Redirect to dashboard with tour active via hard navigation 
            // so the browser gets a fresh JWT for the middleware
            window.location.href = "/?tour=1";

        } catch (err: any) {
            setError(err.message || "Failed to update profile.");
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#000000] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#000000] text-white font-display min-h-screen flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[520px] bg-[#0a0a0a] border border-white/10 rounded-xl p-8 shadow-2xl relative z-10">
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-1.5 flex-1 rounded-full bg-blue-500"></div>
                        <div className="h-1.5 flex-1 rounded-full bg-white/10"></div>
                    </div>
                    <h1 className="text-white text-[28px] md:text-[32px] font-bold leading-tight mb-2 tracking-tight">Complete Your Profile</h1>
                    <p className="text-[#888888] text-sm font-normal">Tell us a bit about your academics to personalize your experience</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="faculty">Faculty</label>
                        <div className="relative">
                            <select
                                id="faculty"
                                value={faculty}
                                onChange={(e) => setFaculty(e.target.value)}
                                className="w-full h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 appearance-none focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                                required
                            >
                                <option value="" disabled className="text-[#888888]">Select Faculty</option>
                                {FACULTIES.map(fac => (
                                    <option key={fac} value={fac}>{fac}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none">▼</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="programme">Programme</label>
                        <input
                            id="programme"
                            type="text"
                            value={programme}
                            onChange={(e) => setProgramme(e.target.value)}
                            placeholder="e.g. BSc Computer Science"
                            className="w-full h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#888888] transition-colors"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="level">Level</label>
                        <div className="relative">
                            <select
                                id="level"
                                value={level}
                                onChange={(e) => setLevel(e.target.value)}
                                className="w-full h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 appearance-none focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
                                required
                            >
                                <option value="" disabled className="text-[#888888]">Select Level</option>
                                <option value="Level 100">Level 100 / Freshman</option>
                                <option value="Level 200">Level 200 / Sophomore</option>
                                <option value="Level 300">Level 300 / Junior</option>
                                <option value="Level 400">Level 400 / Senior</option>
                                <option value="Postgraduate">Postgraduate</option>
                                <option value="Alumni">Alumni</option>
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none">▼</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-white text-base font-medium" htmlFor="whatsapp">WhatsApp Number</label>
                        <div className="flex gap-2">
                            <div className="relative shrink-0">
                                <select
                                    value={dialCode}
                                    onChange={(e) => {
                                        setDialCode(e.target.value);
                                        setIsOtpVerified(false);
                                        setIsOtpSent(false);
                                        setOtpError("");
                                    }}
                                    disabled={isOtpVerified}
                                    className="h-14 pl-3 pr-8 bg-[#111111] border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors disabled:opacity-60 cursor-pointer"
                                >
                                    {COUNTRY_CODES.map((c) => (
                                        <option key={c.code + c.dial} value={c.dial}>
                                            {c.flag} {c.dial}
                                        </option>
                                    ))}
                                </select>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[#888888] pointer-events-none text-xs">▼</span>
                            </div>
                            <input
                                id="whatsapp"
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => {
                                    // Auto-strip leading zeros as they type
                                    const val = e.target.value.replace(/^0+/, '');
                                    setWhatsappNumber(val);
                                    setIsOtpVerified(false);
                                    setIsOtpSent(false);
                                    setOtpError("");
                                }}
                                placeholder="531 423 911 (no leading 0)"
                                className={`flex-1 h-14 bg-[#111111] border ${isOtpVerified ? 'border-green-500/50' : 'border-white/20'} rounded-lg text-white px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#888888] transition-colors`}
                                required
                                disabled={isOtpVerified}
                            />
                            {!isOtpVerified && (
                                <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={otpLoading || !whatsappNumber.trim()}
                                    className="h-14 px-4 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                    {otpLoading && !isOtpSent ? "Sending..." : (isOtpSent ? "Resend" : "Send OTP")}
                                </button>
                            )}
                        </div>
                        {isOtpSent && !isOtpVerified && (
                            <div className="flex flex-col gap-2 mt-2">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit OTP"
                                        className="flex-1 h-14 bg-[#111111] border border-white/20 rounded-lg text-white px-4 focus:outline-none focus:border-white focus:ring-1 focus:ring-white placeholder:text-[#888888] transition-colors"
                                        maxLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleVerifyOtp}
                                        disabled={otpLoading || !otp.trim() || timeLeft === 0}
                                        className="h-14 px-6 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                                    >
                                        {otpLoading && isOtpSent ? "Verifying..." : "Verify"}
                                    </button>
                                </div>
                                <div className="text-right text-sm text-[#888888]">
                                    Expires in <span className="font-medium text-white">{formatTime(timeLeft)}</span>
                                </div>
                            </div>
                        )}
                        {otpError && <p className="text-red-400 text-sm mt-1">{otpError}</p>}
                        {isOtpVerified && <p className="text-green-400 text-sm mt-1">✓ Number verified</p>}
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm font-medium bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full h-14 bg-white text-black font-bold text-lg rounded-lg hover:bg-gray-200 transition-colors mt-8 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <>
                                Complete Profile
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
                <button
                    onClick={async () => {
                        await signOut();
                        router.push('/sign-in');
                    }}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out &amp; use a different account
                </button>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z" fill="currentColor"></path>
                        <path fillRule="evenodd" clipRule="evenodd" d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z" fill="currentColor"></path>
                    </svg>
                    <span className="text-white text-sm font-bold tracking-tight">Locked In.</span>
                </div>
            </div>
        </div>
    );
}
