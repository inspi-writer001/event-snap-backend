import sys
import face_recognition

def get_face_embedding(image_path):
    image = face_recognition.load_image_file(image_path)
    encodings = face_recognition.face_encodings(image)
    return encodings[0] if encodings else None

def main():
    if len(sys.argv) < 3:
        print("USAGE: python face_rec.py <selfie_path> <compare_path>")
        sys.exit(1)

    selfie_path = sys.argv[1]
    compare_path = sys.argv[2]

    selfie_emb = get_face_embedding(selfie_path)
    if selfie_emb is None:
        print("NO_SELFIE")
        return

    compare_emb = get_face_embedding(compare_path)
    if compare_emb is None:
        print("NO_COMPARE")
        return

    distance = face_recognition.face_distance([selfie_emb], compare_emb)[0]
    print(distance)

if __name__ == "__main__":
    main()

