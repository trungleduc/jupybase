import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { createClient } from './client';
import { extractCookies, getURL } from './signin';
import { IS3Auth } from 'jupydrive-s3';
import {
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PROJECT_REF,
  NEXT_PUBLIC_SUPABASE_S3_URL,
  NEXT_PUBLIC_SUPABASE_S3_REGION
} from './config';

const plugin: JupyterFrontEndPlugin<IS3Auth> = {
  id: 'jupybase:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  provides: IS3Auth,
  activate: async (app: JupyterFrontEnd): Promise<IS3Auth> => {
    console.log('JupyterLab extension jupybase is activated!');
    const supabase = createClient();
    const authCookies = extractCookies();
    let factory = () => ({}) as any;
    if (authCookies) {
      await supabase.auth.setSession({
        access_token: authCookies.accessTokenCookie[1],
        refresh_token: authCookies.refreshTokenCookie[1]
      });
      factory = async () => {
        const authSession = await supabase.auth.getSession();
        const sessionToken = authSession.data.session?.access_token;
        const authData = {
          bucket: 'qsai',
          config: {
            forcePathStyle: true,
            endpoint: NEXT_PUBLIC_SUPABASE_S3_URL,
            region: NEXT_PUBLIC_SUPABASE_S3_REGION,
            credentials: {
              accessKeyId: NEXT_PUBLIC_SUPABASE_PROJECT_REF,
              secretAccessKey: NEXT_PUBLIC_SUPABASE_ANON_KEY,
              sessionToken
            }
          }
        };
        return authData;
      };
    } else {
      if (
        location.hostname === 'localhost' ||
        location.hostname === '127.0.0.1'
      ) {
        console.log('USER IS NOT LOGGED IN');
      } else {
        window.location.replace(getURL('/signin/password_signin'));
      }
    }

    return { factory };
  }
};

export default plugin;
