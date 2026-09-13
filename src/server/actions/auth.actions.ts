import { LoginInput, LoginSchema, SignupInput, SignupSchema } from '@/lib/validation/auth.schema';
import { ActionResult, successResult, handleServiceError } from '@/lib/errors/result';
import { ValidationError } from '@/lib/errors';

export async function loginAction(
  rawInput: LoginInput,
  requestId = 'req-' + Math.random().toString(36).substring(7)
): Promise<ActionResult<any>> {
  try {
    const validation = LoginSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'root';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      throw new ValidationError('Input login tidak valid', fieldErrors);
    }

    return successResult({
      user: { email: validation.data.email },
    });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'auth',
      action: 'action.login',
      requestId,
    });
  }
}

export async function signupAction(
  rawInput: SignupInput,
  requestId = 'req-' + Math.random().toString(36).substring(7)
): Promise<ActionResult<any>> {
  try {
    const validation = SignupSchema.safeParse(rawInput);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const issue of validation.error.issues) {
        const field = issue.path.join('.') || 'root';
        if (!fieldErrors[field]) fieldErrors[field] = [];
        fieldErrors[field].push(issue.message);
      }
      throw new ValidationError('Input pendaftaran tidak valid', fieldErrors);
    }

    return successResult({
      user: { fullName: validation.data.fullName, email: validation.data.email },
    });
  } catch (err) {
    return handleServiceError({
      error: err,
      module: 'auth',
      action: 'action.signup',
      requestId,
    });
  }
}
