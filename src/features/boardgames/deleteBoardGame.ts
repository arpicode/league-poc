import type { ActionFunctionArgs } from 'react-router';
import { boardGamesApi } from '../../api/boardGames';
import { idParam, toActionResult } from '../../lib/forms';

// A game used by a tournament answers 409 BOARD_GAME_IN_USE, shown next to the button.
export async function action({ params }: ActionFunctionArgs) {
  try {
    await boardGamesApi.remove(idParam(params.id));
    return null;
  } catch (error) {
    return toActionResult(error);
  }
}
