<?php

namespace App\Support;

final class OfficeIpAddress
{
    public static function isValid(string $value): bool
    {
        $value = trim($value);

        if ($value === '') {
            return false;
        }

        if (! str_contains($value, '/')) {
            return filter_var($value, FILTER_VALIDATE_IP) !== false;
        }

        [$address, $prefixLength] = explode('/', $value, 2);

        if ($address === '' || $prefixLength === '' || ! ctype_digit($prefixLength)) {
            return false;
        }

        if (filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
            return (int) $prefixLength >= 0 && (int) $prefixLength <= 32;
        }

        if (filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false) {
            return (int) $prefixLength >= 0 && (int) $prefixLength <= 128;
        }

        return false;
    }

    /**
     * @param  list<string>  $allowedAddresses
     */
    public static function matches(string $ip, array $allowedAddresses): bool
    {
        if ($allowedAddresses === []) {
            return false;
        }

        foreach ($allowedAddresses as $allowedAddress) {
            if (! is_string($allowedAddress)) {
                continue;
            }

            $allowedAddress = trim($allowedAddress);

            if ($allowedAddress === '') {
                continue;
            }

            if (! str_contains($allowedAddress, '/')) {
                if ($ip === $allowedAddress) {
                    return true;
                }

                continue;
            }

            if (self::ipInCidr($ip, $allowedAddress)) {
                return true;
            }
        }

        return false;
    }

    private static function ipInCidr(string $ip, string $cidr): bool
    {
        [$subnet, $bits] = explode('/', $cidr, 2);
        $bits = (int) $bits;

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false
            && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) !== false) {
            $ipLong = ip2long($ip);
            $subnetLong = ip2long($subnet);

            if ($ipLong === false || $subnetLong === false) {
                return false;
            }

            $mask = $bits === 0 ? 0 : (-1 << (32 - $bits));

            return ($ipLong & $mask) === ($subnetLong & $mask);
        }

        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false
            && filter_var($subnet, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) !== false) {
            $ipBin = inet_pton($ip);
            $subnetBin = inet_pton($subnet);

            if ($ipBin === false || $subnetBin === false) {
                return false;
            }

            $bytes = intdiv($bits, 8);
            $remainder = $bits % 8;

            if ($bytes > 0 && substr($ipBin, 0, $bytes) !== substr($subnetBin, 0, $bytes)) {
                return false;
            }

            if ($remainder === 0) {
                return true;
            }

            $mask = (0xFF << (8 - $remainder)) & 0xFF;

            return (ord($ipBin[$bytes]) & $mask) === (ord($subnetBin[$bytes]) & $mask);
        }

        return false;
    }
}
