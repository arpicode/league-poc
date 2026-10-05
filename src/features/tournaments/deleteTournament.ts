import { redirect, type ActionFunctionArgs } from 'react-router';
import { tournamentsApi } from '../../api/tournaments';
import { idParam, toActionResult } from '../../lib/forms';

export async function action({ params }: ActionFunctionArgs) {
  try {
    await tournamentsApi.remove(idParam(params.id));
  } catch (error) {
    return toActionResult(error);
  }

  return redirect('/tournaments');
}
