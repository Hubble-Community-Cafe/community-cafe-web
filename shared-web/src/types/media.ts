/** An uploaded image (event/board/menu photo), served by the backend. */
export interface MediaAsset {
  id: number
  url: string
  alt: string | null
  width: number | null
  height: number | null
}
