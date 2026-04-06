import { ADMIN_PASSWORD } from '../utils/constants.js';

/** @param {string} password */
export function validateAdminPassword(password) {
    return password === ADMIN_PASSWORD;
}
