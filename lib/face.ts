console.log('FacePP configured:', !!process.env.FACEPP_API_KEY, !!process.env.FACEPP_API_SECRET)

export async function testFaceppConnection() {
  const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/detect', {
    method: 'POST',
    body: new URLSearchParams({
      api_key: process.env.FACEPP_API_KEY!,
      api_secret: process.env.FACEPP_API_SECRET!,
      image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/320px-Gatto_europeo4.jpg',
      return_attributes: 'none'
    })
  })
  
  const data = await response.json()
  console.log('FacePP test response:', data)
  return data
}

export async function compareFaces(selfieBase64: string, formPhotoBase64: string) {
  const formData = new FormData()
  formData.append('api_key', process.env.FACEPP_API_KEY!)
  formData.append('api_secret', process.env.FACEPP_API_SECRET!)
  formData.append('image_base64_1', selfieBase64)
  formData.append('image_base64_2', formPhotoBase64)

  const response = await fetch('https://api-us.faceplusplus.com/facepp/v3/compare', {
    method: 'POST',
    body: formData
  })
  
  const result = await response.json()

  if (result.error_message) {
    throw new Error(`Face++ API Error: ${result.error_message}`)
  }

  // result.confidence is 0-100
  // Above 80 = same person
  // Below 80 = reject
  if (result.confidence < 80) {
    throw new Error('Face does not match your registration form photo')
  }

  return result
}
