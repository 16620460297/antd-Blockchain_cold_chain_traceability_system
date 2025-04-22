const TOKEN_KEY = 'cold_chain_token'
const USER_INFO_KEY = 'cold_chain_user_info'

export function getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
}

export function removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
}

export function getUserInfo(): any {
    const userInfoStr = localStorage.getItem(USER_INFO_KEY)
    if (userInfoStr) {
        try {
            return JSON.parse(userInfoStr)
        } catch (error) {
            return null
        }
    }
    return null
}

export function setUserInfo(info: any): void {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(info))
}

export function removeUserInfo(): void {
    localStorage.removeItem(USER_INFO_KEY)
}

export function clearAuth(): void {
    removeToken()
    removeUserInfo()
}
