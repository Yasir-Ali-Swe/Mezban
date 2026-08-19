'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
    FieldContent,
    FieldDescription,
} from '@/components/ui/field';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2, Building2, Mail, Phone, MapPin, Globe, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from "@/components/ui/toast";
import { useRouter } from 'next/navigation';
import { useBusinessProfile, useUpdateBusinessProfile } from '@/hooks/useApi';

// Dummy business profile data
const DUMMY_BUSINESS_PROFILE = {
    _id: 'business_123456789',
    name: 'Pizza Palace',
    email: 'info@pizzapalace.com',
    phone: '+92 300 1234567',
    address: '123 Main Boulevard, Gulberg III',
    city: 'Lahore',
    country: 'Pakistan',
    website: 'https://pizzapalace.com',
    imageUrl: 'https://ui-avatars.com/api/?name=Pizza+Palace&background=EF4444&color=fff&size=128',
};

// Dummy cities for dropdown
const DUMMY_CITIES = [
    { _id: '1', name: 'Lahore' },
    { _id: '2', name: 'Karachi' },
    { _id: '3', name: 'Islamabad' },
    { _id: '4', name: 'Rawalpindi' },
    { _id: '5', name: 'Multan' },
    { _id: '6', name: 'Faisalabad' },
    { _id: '7', name: 'Peshawar' },
    { _id: '8', name: 'Quetta' },
];

// Dummy countries for dropdown
const DUMMY_COUNTRIES = [
    { _id: '1', name: 'Pakistan' },
    { _id: '2', name: 'India' },
    { _id: '3', name: 'United Arab Emirates' },
    { _id: '4', name: 'Saudi Arabia' },
    { _id: '5', name: 'United Kingdom' },
    { _id: '6', name: 'United States' },
    { _id: '7', name: 'Canada' },
    { _id: '8', name: 'Australia' },
];

// Zod schema for validation
const businessProfileSchema = z.object({
    name: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
    address: z.string().min(5, { message: 'Address is required' }),
    city: z.string().min(1, { message: 'Please select a city' }),
    country: z.string().min(1, { message: 'Please select a country' }),
    website: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

const BusinessInfo = ({ mode = "dashboard" }) => {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const { data: profileResponse, isLoading } = useBusinessProfile();
    const updateProfileMutation = useUpdateBusinessProfile();

    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isPending, setIsPending] = useState(false);
    const [originalValues, setOriginalValues] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        website: '',
    });

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(businessProfileSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: '',
            website: '',
        },
    });

    useEffect(() => {
        if (profileResponse?.data) {
            const profile = profileResponse.data;
            const vals = {
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                address: profile.address || '',
                city: profile.city || '',
                country: profile.country || '',
                website: profile.website || '',
            };
            reset(vals);
            setOriginalValues(vals);
            if (profile.imageUrl) {
                setPreviewImage(profile.imageUrl);
            }
        }
    }, [profileResponse, reset]);

    const watchedName = watch('name');
    const watchedEmail = watch('email');
    const watchedPhone = watch('phone');
    const watchedAddress = watch('address');
    const watchedCity = watch('city');
    const watchedCountry = watch('country');
    const watchedWebsite = watch('website');

    // Check if form has changes
    const hasChanges = () => {
        return (
            (watchedName || '') !== originalValues.name ||
            (watchedEmail || '') !== originalValues.email ||
            (watchedPhone || '') !== originalValues.phone ||
            (watchedAddress || '') !== originalValues.address ||
            (watchedCity || '') !== originalValues.city ||
            (watchedCountry || '') !== originalValues.country ||
            (watchedWebsite || '') !== originalValues.website ||
            selectedFile !== null
        );
    };

    // Handle image selection
    const handleImageSelect = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setPreviewImage(objectUrl);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle image click to trigger file input
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    // Handle form submission
    const onSubmit = async (values) => {
        setIsPending(true);
        try {
            await updateProfileMutation.mutateAsync({
                name: values.name,
                email: values.email,
                phone: values.phone,
                address: values.address,
                city: values.city,
                country: values.country,
                website: values.website,
                imageUrl: previewImage || null,
            });

            setOriginalValues(values);
            toast.add({
                type: "success",
                title: "Success!",
                description: "Business information updated successfully!",
            });
            reset(values);
            if (mode === "onboarding") {
                router.push('/onboarding/business-knowledge');
            }
        } catch (error) {
            toast.add({
                type: "error",
                title: "Error!",
                description: error.response?.data?.message || "Failed to update business information",
            });
        } finally {
            setIsPending(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        router.push('/onboarding/business-type');
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const avatarImage = previewImage || DUMMY_BUSINESS_PROFILE.imageUrl || '';
    const initials = DUMMY_BUSINESS_PROFILE.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'B';

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-left space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Business Information</h1>
                    <p className="text-sm text-muted-foreground">
                        Tell us about your business
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-4">
                        {/* Business Image */}
                        <div className="flex justify-center">
                            <div className="relative group">
                                <Avatar
                                    className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-90"
                                    onClick={handleImageClick}
                                >
                                    <AvatarImage src={avatarImage} alt="Business" />
                                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <button
                                    type="button"
                                    className={cn(
                                        "absolute bottom-0 right-0 bg-primary p-2 text-primary-foreground shadow-sm",
                                        "transition-all hover:bg-primary/90 hover:scale-110",
                                        "ring-2 ring-background rounded-full"
                                    )}
                                    onClick={handleImageClick}
                                >
                                    <Camera className="h-4 w-4" />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                            </div>
                        </div>
                        {selectedFile && (
                            <p className="text-center text-xs text-muted-foreground">
                                New image selected: {selectedFile.name}
                            </p>
                        )}

                        {/* Row 1: Business Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="name" className="text-sm font-medium">
                                    Business Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            type="text"
                                            placeholder="Enter business name"
                                            className="pl-9 h-10 text-sm"
                                            {...register("name")}
                                            aria-invalid={errors.name ? "true" : "false"}
                                        />
                                    </div>
                                    {errors.name && (
                                        <FieldError errors={[errors.name]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="email" className="text-sm font-medium">
                                    Business Email <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter business email"
                                            className="pl-9 h-10 text-sm"
                                            {...register("email")}
                                            aria-invalid={errors.email ? "true" : "false"}
                                        />
                                    </div>
                                    {errors.email && (
                                        <FieldError errors={[errors.email]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 2: Contact Number + website */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="phone" className="text-sm font-medium">
                                    Contact Number <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="Enter contact number"
                                            className="pl-9 h-10 text-sm"
                                            {...register("phone")}
                                            aria-invalid={errors.phone ? "true" : "false"}
                                        />
                                    </div>
                                    {errors.phone && (
                                        <FieldError errors={[errors.phone]} />
                                    )}
                                </FieldContent>
                            </Field>
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="website" className="text-sm font-medium">
                                    Website <span className="text-muted-foreground text-xs">(Optional)</span>
                                </FieldLabel>
                                <FieldContent>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            id="website"
                                            type="url"
                                            placeholder="https://example.com"
                                            className="pl-9 h-10 text-sm"
                                            {...register("website")}
                                            aria-invalid={errors.website ? "true" : "false"}
                                        />
                                    </div>
                                    {errors.website && (
                                        <FieldError errors={[errors.website]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 3: City + Country */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="city" className="text-sm font-medium">
                                    City <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={watchedCity}
                                        onValueChange={(value) => setValue('city', value)}
                                    >
                                        <SelectTrigger className="w-full text-sm px-3 py-4.75">
                                            <SelectValue placeholder="Select a city" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Cities</SelectLabel>
                                                {DUMMY_CITIES.map((city) => (
                                                    <SelectItem key={city._id} value={city.name}>
                                                        {city.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.city && (
                                        <FieldError errors={[errors.city]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="country" className="text-sm font-medium">
                                    Country <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Select
                                        value={watchedCountry}
                                        onValueChange={(value) => setValue('country', value)}
                                    >
                                        <SelectTrigger className="w-full text-sm px-3 py-4.75">
                                            <SelectValue placeholder="Select a country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <SelectLabel>Countries</SelectLabel>
                                                {DUMMY_COUNTRIES.map((country) => (
                                                    <SelectItem key={country._id} value={country.name}>
                                                        {country.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    {errors.country && (
                                        <FieldError errors={[errors.country]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 4: Address */}
                        <Field orientation="vertical">
                            <FieldLabel htmlFor="address" className="text-sm font-medium">
                                Address <span className="text-destructive">*</span>
                            </FieldLabel>
                            <FieldContent>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="address"
                                        placeholder="Enter street address"
                                        className="pl-9 h-20 text-sm resize-none"
                                        {...register("address")}
                                        aria-invalid={errors.address ? "true" : "false"}
                                    />
                                </div>
                                {errors.address && (
                                    <FieldError errors={[errors.address]} />
                                )}
                            </FieldContent>
                        </Field>

                        {/* Buttons */}
                        <div className="flex items-center justify-end gap-3 border-t border-border pt-2">
                            <Button
                                type="submit"
                                className="h-10 text-sm font-medium"
                                disabled={mode === 'onboarding' ? isPending : (!hasChanges() || isPending)}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Save & Continue'
                                )}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
};

export default BusinessInfo;