import { instance, authHeader } from './api';
import axios from 'axios';
import * as fs from 'fs-extra';
import { Artifact } from '../types';

export const listArtifactsForJob = async (artifactsUrl: string) => {
  try {
    return (await instance.get(artifactsUrl)).data;
  } catch (error) {
    throw error;
  }
};

export const downloadArtifact = async (artifact: Artifact, directory: string) => {
  try {
    const artifactFilename = extractFileName(artifact);
    const artifactPath = `${directory}/${artifactFilename}`;
    await fs.ensureFile(artifactPath);

    const writer = fs.createWriteStream(artifactPath);
    const signedUrl = await getSignedUrl(artifact.download_url);
    const response = await axios({
      url: signedUrl,
      method: 'GET',
      responseType: 'stream',
    });

    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw error;
  }
};

const getSignedUrl = async(downloadUrl: string) => {
  try {
    await axios({ url: downloadUrl, headers: authHeader, maxRedirects: 0 });
  } catch (error) {
    // Buildkite returns a 302 response when returning a signed url for S3 but
    // Axios throws 302 responses.
    return error.response.data.url;
  }
};

const extractFileName = (artifact: Artifact) => {
  const strSplit = artifact.filename.split('\\');
  return strSplit[1];
};
