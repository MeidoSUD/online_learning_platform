<?php

namespace App\Services;

use App\Agora\RtcTokenBuilder;

class AgoraService
{
    public function generateRtcToken($channelName, $uid)
    {
        $appId = env('AGORA_APP_ID');
        $appCertificate = env('AGORA_APP_CERTIFICATE');

        $expireTimeSeconds = 3600;
        $privilegeExpireTs = time() + $expireTimeSeconds;

        return RtcTokenBuilder::buildTokenWithUserAccount(
            $appId,
            $appCertificate,
            $channelName,
            $uid, // can be numeric or string user ID
            RtcTokenBuilder::RolePublisher,
            $privilegeExpireTs
        );
    }
}
