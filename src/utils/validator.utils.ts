// Validators: src/utils/validators.ts
interface ContactInput {
  fullname: string;
  email: string;
  subject: string;
  phone: string;
  message: string;
}

export const validateContactInput = (input: ContactInput): string | null => {
  const { fullname, email, subject, phone, message } = input;

  if (!fullname || fullname.trim().length < 2) {
    return "Full name must be at least 2 characters";
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Please provide a valid email address";
  }

  if (!subject || subject.trim().length < 2) {
    return "Subject must be at least 2 characters";
  }

  if (
    !phone ||
    !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(phone)
  ) {
    return "Please provide a valid phone number";
  }

  if (!message || message.trim().length < 10) {
    return "Message must be at least 10 characters";
  }

  return null;
};
