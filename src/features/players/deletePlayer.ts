import type { ActionFunctionArgs } from 'react-router';
import { playersApi } from '../../api/players';
import { idParam, toActionResult } from '../../lib/forms';

// Returns rather than redirects: the list it was posted from revalidates and the row disappears.
export async function action({ params }: ActionFunctionArgs) {
  try {
    await playersApi.remove(idParam(params.id));
    return null;
  } catch (error) {
    return toActionResult(error);
  }
}
