'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Field,
    FieldLabel,
    FieldError,
    FieldGroup,
    FieldContent,
} from '@/components/ui/field';
import { Camera, Loader2, Calendar, Building2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Dummy user profile data
const DUMMY_USER_PROFILE = {
    _id: 'user_123456789',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+92 300 1234567',
    businessName: 'Pizza Palace',
    businessType: 'Restaurant',
    createdAt: '2024-01-15T10:30:00Z',
    imageUrl: 'https://ui-avatars.com/api/?name=John+Doe&background=6B46C1&color=fff&size=128',
};

// Zod schema for validation
const profileSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
    email: z.string().email({ message: 'Please enter a valid email address' }),
    phone: z.string().min(10, { message: 'Please enter a valid phone number' }),
    businessName: z.string().min(2, { message: 'Business name must be at least 2 characters' }),
});

const ProfilePage = () => {
    const fileInputRef = useRef(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPending, setIsPending] = useState(false);
    const [originalValues, setOriginalValues] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
    });

    // Simulate API call to fetch user profile
    useEffect(() => {
        const timer = setTimeout(() => {
            const profile = DUMMY_USER_PROFILE;
            reset({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                businessName: profile.businessName || '',
            });
            setOriginalValues({
                name: profile.name || '',
                email: profile.email || '',
                phone: profile.phone || '',
                businessName: profile.businessName || '',
            });
            if (profile.imageUrl) {
                setPreviewImage(profile.imageUrl);
            }
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            businessName: '',
        },
    });

    const watchedName = watch('name');
    const watchedEmail = watch('email');
    const watchedPhone = watch('phone');
    const watchedBusinessName = watch('businessName');

    // Check if form has changes
    const hasChanges = () => {
        return (
            (watchedName || '') !== originalValues.name ||
            (watchedEmail || '') !== originalValues.email ||
            (watchedPhone || '') !== originalValues.phone ||
            (watchedBusinessName || '') !== originalValues.businessName ||
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

    // Handle image click to trigger file input
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    // Handle form submission
    const onSubmit = (values) => {
        setIsPending(true);

        // Simulate API call
        setTimeout(() => {
            setOriginalValues({
                name: values.name,
                email: values.email,
                phone: values.phone,
                businessName: values.businessName,
            });

            if (selectedFile) {
                setSelectedFile(null);
            }

            toast.success('Profile updated successfully!');
            setIsPending(false);
            reset(values);
        }, 1500);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const avatarImage = previewImage || DUMMY_USER_PROFILE.imageUrl || '';
    const initials = DUMMY_USER_PROFILE.name
        ?.split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

    return (
        <div className="flex justify-center px-4 py-6 sm:py-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center space-y-2 mb-6">
                    <h1 className="text-2xl font-bold tracking-tight">Personal Information</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage your personal and business information
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <FieldGroup className="space-y-4">
                        {/* Profile Image */}
                        <div className="flex justify-center">
                            <div className="relative group">
                                <Avatar
                                    className="h-24 w-24 cursor-pointer transition-opacity hover:opacity-90"
                                    onClick={handleAvatarClick}
                                >
                                    <AvatarImage src={avatarImage} alt="Profile" />
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
                                    onClick={handleAvatarClick}
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

                        {/* Row 1: Full Name + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="name" className="text-sm font-medium">
                                    Full Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        className="h-10 text-sm"
                                        {...register("name")}
                                        aria-invalid={errors.name ? "true" : "false"}
                                    />
                                    {errors.name && (
                                        <FieldError errors={[errors.name]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="email" className="text-sm font-medium">
                                    Email Address <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="Enter your email address"
                                        className="h-10 text-sm"
                                        {...register("email")}
                                        aria-invalid={errors.email ? "true" : "false"}
                                    />
                                    {errors.email && (
                                        <FieldError errors={[errors.email]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 2: Phone Number + Business Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel htmlFor="phone" className="text-sm font-medium">
                                    Phone Number <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter phone number"
                                        className="h-10 text-sm"
                                        {...register("phone")}
                                        aria-invalid={errors.phone ? "true" : "false"}
                                    />
                                    {errors.phone && (
                                        <FieldError errors={[errors.phone]} />
                                    )}
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel htmlFor="businessName" className="text-sm font-medium">
                                    Business Name <span className="text-destructive">*</span>
                                </FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="businessName"
                                        type="text"
                                        placeholder="Enter your business name"
                                        className="h-10 text-sm"
                                        {...register("businessName")}
                                        aria-invalid={errors.businessName ? "true" : "false"}
                                    />
                                    {errors.businessName && (
                                        <FieldError errors={[errors.businessName]} />
                                    )}
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Row 3: Business Type (Read Only) + Created Date (Read Only) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium">
                                    Business Type
                                </FieldLabel>
                                <FieldContent>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground gap-2">
                                        <Briefcase className="h-4 w-4" />
                                        {DUMMY_USER_PROFILE.businessType}
                                    </div>
                                </FieldContent>
                            </Field>

                            <Field orientation="vertical">
                                <FieldLabel className="text-sm font-medium">
                                    Created Date
                                </FieldLabel>
                                <FieldContent>
                                    <div className="h-10 px-3 py-2 rounded-md border bg-muted/50 flex items-center text-sm text-muted-foreground gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(DUMMY_USER_PROFILE.createdAt)}
                                    </div>
                                </FieldContent>
                            </Field>
                        </div>

                        {/* Update Button */}
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                className="h-10 text-sm font-medium"
                                disabled={!hasChanges() || isPending}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Profile'
                                )}
                            </Button>
                        </div>
                    </FieldGroup>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;